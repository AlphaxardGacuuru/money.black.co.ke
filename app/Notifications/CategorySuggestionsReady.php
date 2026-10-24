<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class CategorySuggestionsReady extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $count) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title(__('Your monthly category check-in'))
            ->icon('/notification-badge-192x192.png')
            ->badge('/notification-badge-192x192.png')
            ->body(trans_choice('{1} We have :count idea to keep your categories tidy.|[2,*] We have :count ideas to keep your categories tidy.', $this->count))
            ->data(['url' => '/categories']);
    }
}
