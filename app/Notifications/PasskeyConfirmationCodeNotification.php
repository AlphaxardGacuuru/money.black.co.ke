<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent synchronously (not queued) so the code arrives while the user is waiting for it.
 */
class PasskeyConfirmationCodeNotification extends Notification
{
    use Queueable;

    public function __construct(public string $code, public int $expiresInMinutes) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Your :app security code', ['app' => config('app.name')]))
            ->greeting(__('Hello :name,', ['name' => $notifiable->name]))
            ->line(__('Use this code to confirm it\'s you before changing the security settings on your account:'))
            ->line("**{$this->code}**")
            ->line(__('This code expires in :minutes minutes.', ['minutes' => $this->expiresInMinutes]))
            ->line(__('If you didn\'t request this, you can ignore this email. Someone may be trying to access your account.'));
    }
}
