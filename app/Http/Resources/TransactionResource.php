<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'category_id' => $this->category_id,
            'account_id' => $this->account_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'transaction_date' => $this->transaction_date?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'account' => $this->whenLoaded('account', fn (): array => [
                'id' => $this->account->id,
                'name' => $this->account->name,
                'currency' => $this->account->currency,
                'icon' => $this->account->icon,
                'color' => $this->account->color,
            ]),
            'category' => $this->whenLoaded('category', fn (): array => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'type' => $this->category->type,
                'icon' => $this->category->icon,
                'color' => $this->category->color,
            ]),
        ];
    }
}
