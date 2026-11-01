<?php

namespace App\Notifications;

use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * Sent after the monthly category review when it produced at least one idea.
 */
class CategorySuggestionsReady extends Notification implements ShouldQueue
{
    use Queueable;

    public const URL = '/category-suggestions';

    /**
     * @param  array<int, string>  $ideas  One line per suggestion, e.g. 'Add a "Fuel" category'.
     * @param  string  $period  The month that was reviewed, as YYYY-MM.
     */
    public function __construct(public array $ideas, public string $period) {}

    /**
     * Push reaches users who allowed notifications on a device; the others still get email and the in-app record.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class, 'mail', 'database'];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title(__('Your monthly category check-in'))
            ->icon('/notification-badge-192x192.png')
            ->badge('/notification-badge-192x192.png')
            ->body($this->message())
            ->data(['url' => self::URL]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject(trans_choice('{1} :count category idea from your :month spending|[2,*] :count category ideas from your :month spending', count($this->ideas), ['month' => $this->monthName()]))
            ->greeting(__('Hello :name,', ['name' => $notifiable->name]))
            ->line(__('We looked at your :month transactions. Here is what could make your categories clearer:', ['month' => $this->monthName()]));

        foreach ($this->ideas as $idea) {
            $mail->line("• {$idea}");
        }

        return $mail
            ->line(__('Nothing changes until you add or rename.'))
            ->action(__('Review ideas'), url(self::URL));
    }

    /**
     * @return array{url: string, from: string, title: string, message: string, ideas: array<int, string>, period: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'url' => self::URL,
            'from' => config('app.name'),
            'title' => __('Your monthly category check-in'),
            'message' => $this->message(),
            'ideas' => $this->ideas,
            'period' => $this->period,
        ];
    }

    private function message(): string
    {
        return trans_choice('{1} We have :count idea to keep your categories tidy.|[2,*] We have :count ideas to keep your categories tidy.', count($this->ideas));
    }

    private function monthName(): string
    {
        return CarbonImmutable::createFromFormat('!Y-m', $this->period)->format('F');
    }
}
