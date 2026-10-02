<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * An operational alert to the admin account, not a user-facing preference,
 * always sent.
 */
class AdminNewUserSignupNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected User $newUser) {}

    /**
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    protected function bodyLine(): string
    {
        return "New user signed up: {$this->newUser->name} ({$this->newUser->email}).";
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->from('al@mail.black.co.ke', 'Alphaxard from Black Money')
            ->subject('New user signup')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line($this->bodyLine())
            ->action('View overview', url('/overview'));
    }

    public function toArray($notifiable): array
    {
        return [
            'url' => '/overview',
            'from' => 'System',
            'message' => $this->bodyLine(),
        ];
    }
}
