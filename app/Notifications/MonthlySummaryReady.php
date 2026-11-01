<?php

namespace App\Notifications;

use App\Models\MonthlySummary;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * Sent when the AI summary of last month's spending is ready.
 */
class MonthlySummaryReady extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public MonthlySummary $summary) {}

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
            ->title($this->title())
            ->icon('/notification-badge-192x192.png')
            ->badge('/notification-badge-192x192.png')
            ->body($this->summary->headline)
            ->data(['url' => $this->url()]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title())
            ->greeting(__('Hello :name,', ['name' => $notifiable->name]))
            ->line("**{$this->summary->headline}**")
            ->line($this->summary->summary)
            ->action(__('Open Overview'), url($this->url()));
    }

    /**
     * @return array{url: string, from: string, title: string, message: string, period: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'url' => $this->url(),
            'from' => config('app.name'),
            'title' => $this->title(),
            'message' => $this->summary->headline,
            'period' => $this->summary->period,
        ];
    }

    private function title(): string
    {
        return __('Your :month money summary', [
            'month' => CarbonImmutable::createFromFormat('!Y-m', $this->summary->period)->format('F Y'),
        ]);
    }

    /**
     * Opens Overview on the summarised month, where the summary card is shown.
     */
    private function url(): string
    {
        return "/overview?month={$this->summary->period}";
    }
}
