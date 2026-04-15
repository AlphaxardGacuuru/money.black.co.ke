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
            'userId' => $this->user_id,
            // Category
            'categoryId' => $this->category_id,
            'categoryName' => $this->category->name,
            'categoryType' => $this->category->type,
            'categoryIcon' => $this->category->icon,
            'categoryColor' => $this->category->color,
            // Account
            'accountId' => $this->account_id,
            'accountName' => $this->account->name,
            'accountCurrency' => $this->account->currency,
            'accountIcon' => $this->account->icon,
            'accountColor' => $this->account->color,
            'amount' => [
                'amount' => $this->amount,
                'formatted' => number_format($this->amount, 2),
            ],
            'currency' => $this->currency,
            'notes' => $this->notes,
            'transactionDateHuman' => $this->transaction_date->format('d M Y'),
            'transactionDateInput' => $this->transaction_date->toDateString(),
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
