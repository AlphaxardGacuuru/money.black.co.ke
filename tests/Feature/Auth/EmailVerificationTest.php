<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_prompt_redirects_to_the_spa_verification_screen()
    {
        $response = $this->get(route('verification.notice', [
            'id' => 'some-id',
            'hash' => 'some-hash',
            'expires' => 12345,
            'signature' => 'some-signature',
        ]));

        $response->assertRedirect(
            config('app.url').'/#/verify-email/some-id/some-hash?expires=12345&signature=some-signature'
        );
    }

    public function test_email_can_be_verified()
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $response = $this->actingAs($user)->post($verificationUrl);

        $response->assertOk()
            ->assertJson(['status' => 'success', 'message' => 'Email Successfully Verified.']);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_already_verified_user_is_not_reverified()
    {
        $user = User::factory()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $response = $this->actingAs($user)->post($verificationUrl);

        $response->assertOk()
            ->assertJson(['status' => 'success', 'message' => 'Email Already Verified.']);

        Event::assertNotDispatched(Verified::class);
    }

    public function test_email_is_not_verified_with_invalid_hash()
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')],
        );

        $this->actingAs($user)->post($verificationUrl)->assertForbidden();

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_link_requires_a_valid_signature()
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $unsignedUrl = route('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]);

        $this->actingAs($user)->post($unsignedUrl)->assertForbidden();

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_link_expires()
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)->post($verificationUrl)->assertForbidden();

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_verification_requires_authentication()
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->postJson($verificationUrl)->assertUnauthorized();
    }
}
