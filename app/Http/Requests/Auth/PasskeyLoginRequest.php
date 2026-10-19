<?php

namespace App\Http\Requests\Auth;

use App\Http\Controllers\Auth\PasskeyLoginController;
use App\Http\Requests\Concerns\ParsesPasskeyCredential;
use Illuminate\Foundation\Http\FormRequest;
use Webauthn\PublicKeyCredentialRequestOptions;

class PasskeyLoginRequest extends FormRequest
{
    use ParsesPasskeyCredential;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'challenge_token' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
            ...$this->credentialRules(),
        ];
    }

    public function verificationOptions(): PublicKeyCredentialRequestOptions
    {
        return $this->pullCachedOptions(
            PasskeyLoginController::cacheKey($this->string('challenge_token')->toString()),
            PublicKeyCredentialRequestOptions::class,
        );
    }
}
