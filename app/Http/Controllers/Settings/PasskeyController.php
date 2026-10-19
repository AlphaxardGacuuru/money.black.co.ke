<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasskeyStoreRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Passkeys\Actions\DeletePasskey;
use Laravel\Passkeys\Actions\GenerateRegistrationOptions;
use Laravel\Passkeys\Actions\StorePasskey;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Support\WebAuthn;

class PasskeyController extends Controller
{
    /**
     * List the authenticated user's passkeys.
     */
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()->passkeys()->latest()->get()
            ->map(fn (Passkey $passkey): array => $this->present($passkey));

        return response()->json(['data' => $passkeys]);
    }

    /**
     * Issue a WebAuthn challenge for registering a new passkey on this device.
     */
    public function options(Request $request, GenerateRegistrationOptions $generate): JsonResponse
    {
        $options = $generate($request->user());

        Cache::put(self::cacheKey($request->user()), WebAuthn::toJson($options), now()->addMinutes(5));

        return response()->json([
            'options' => WebAuthn::toBrowserArray($options),
        ]);
    }

    /**
     * Verify the attestation and store the new passkey.
     */
    public function store(PasskeyStoreRequest $request, StorePasskey $storePasskey): JsonResponse
    {
        $passkey = $storePasskey(
            $request->user(),
            $request->string('name')->toString(),
            $request->credential(),
            $request->registrationOptions(),
        );

        return response()->json([
            'message' => __('Biometric login enabled on this device.'),
            'data' => $this->present($passkey),
        ], 201);
    }

    /**
     * Remove one of the authenticated user's passkeys.
     */
    public function destroy(Request $request, Passkey $passkey, DeletePasskey $deletePasskey): JsonResponse
    {
        abort_unless($passkey->user_id === $request->user()->getKey(), 403);

        $deletePasskey($request->user(), $passkey);

        return response()->json(['message' => __('Passkey removed.')]);
    }

    public static function cacheKey(User $user): string
    {
        return "passkey_registration:{$user->getKey()}";
    }

    /**
     * @return array{id: int, name: string, authenticator: string|null, last_used_at: string|null, created_at: string|null}
     */
    private function present(Passkey $passkey): array
    {
        return [
            'id' => $passkey->id,
            'name' => $passkey->name,
            'authenticator' => $passkey->authenticator,
            'last_used_at' => $passkey->last_used_at?->toIso8601String(),
            'created_at' => $passkey->created_at?->toIso8601String(),
        ];
    }
}
