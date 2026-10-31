<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The welcome email was copied from Black Property and went out with its
 * sender, name and dashboard link.
 */
class WelcomeNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_welcomes_users_to_black_money(): void
    {
        $user = User::factory()->create(['name' => 'Jane']);

        $mail = (new WelcomeNotification)->toMail($user);

        // Sent from the app's own MAIL_FROM_ADDRESS
        $this->assertEmpty($mail->from);
        $this->assertSame('Welcome to Black Money!', $mail->subject);
        $this->assertSame(url('/overview'), $mail->actionUrl);
        $this->assertStringNotContainsString('Property', implode(' ', $mail->introLines));
        $this->assertStringNotContainsString('Property', (new WelcomeNotification)->toArray($user)['message']);
    }
}
