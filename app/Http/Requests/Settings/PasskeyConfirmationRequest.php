<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\Concerns\ParsesPasskeyCredential;
use App\Support\PasskeyActionConfirmation;
use Illuminate\Foundation\Http\FormRequest;
use Webauthn\PublicKeyCredentialRequestOptions;

class PasskeyConfirmationRequest extends FormRequest
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
        return $this->credentialRules();
    }

    public function verificationOptions(): PublicKeyCredentialRequestOptions
    {
        return $this->pullCachedOptions(
            PasskeyActionConfirmation::for($this->user())->verificationOptionsKey(),
            PublicKeyCredentialRequestOptions::class,
        );
    }
}
