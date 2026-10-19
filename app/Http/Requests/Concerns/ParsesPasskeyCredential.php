<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Laravel\Passkeys\Support\WebAuthn;
use Throwable;
use Webauthn\PublicKeyCredential;

trait ParsesPasskeyCredential
{
    protected PublicKeyCredential $publicKeyCredential;

    /**
     * Validation rules for the WebAuthn credential payload sent by the browser.
     *
     * @return array<string, array<int, string>>
     */
    protected function credentialRules(): array
    {
        return [
            'credential' => ['required', 'array'],
            'credential.id' => ['required', 'string'],
            'credential.rawId' => ['required', 'string'],
            'credential.type' => ['required', 'string', 'in:public-key'],
            'credential.response' => ['required', 'array'],
        ];
    }

    /**
     * Deserialize the credential once the payload has passed validation.
     */
    protected function passedValidation(): void
    {
        try {
            $this->publicKeyCredential = WebAuthn::fromJson(
                json_encode($this->input('credential')) ?: '{}',
                PublicKeyCredential::class
            );
        } catch (Throwable) {
            throw ValidationException::withMessages(['credential' => __('Invalid credential format.')]);
        }
    }

    public function credential(): PublicKeyCredential
    {
        return $this->publicKeyCredential;
    }

    /**
     * Pull the single-use ceremony options that were cached when the challenge was issued.
     *
     * @template T of object
     *
     * @param  class-string<T>  $class
     * @return T
     */
    protected function pullCachedOptions(string $cacheKey, string $class): object
    {
        $serialized = Cache::pull($cacheKey);

        if (! $serialized) {
            throw ValidationException::withMessages(['credential' => __('Your passkey request has expired. Please try again.')]);
        }

        return WebAuthn::fromJson($serialized, $class);
    }
}
