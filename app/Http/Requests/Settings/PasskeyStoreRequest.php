<?php

namespace App\Http\Requests\Settings;

use App\Http\Controllers\Settings\PasskeyController;
use App\Http\Requests\Concerns\ParsesPasskeyCredential;
use Illuminate\Foundation\Http\FormRequest;
use Webauthn\PublicKeyCredentialCreationOptions;

class PasskeyStoreRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            ...$this->credentialRules(),
        ];
    }

    public function registrationOptions(): PublicKeyCredentialCreationOptions
    {
        return $this->pullCachedOptions(
            PasskeyController::cacheKey($this->user()),
            PublicKeyCredentialCreationOptions::class,
        );
    }
}
