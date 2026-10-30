<?php

namespace App\Http\Resources;

use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReceiptResource extends JsonResource
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
            'status' => $this->status,
            'processingStep' => $this->status === Receipt::STATUS_PROCESSING ? $this->processing_step : null,
            'processingAttempt' => $this->status === Receipt::STATUS_PROCESSING ? $this->processing_attempt : null,
            'processingStepAt' => $this->status === Receipt::STATUS_PROCESSING ? $this->processing_step_at : null,
            'merchant' => $this->merchant,
            'receiptDate' => $this->receipt_date?->toDateString(),
            'currency' => $this->currency,
            'total' => $this->total,
            'tax' => $this->tax,
            'discount' => $this->discount,
            'accountId' => $this->account_id,
            'originalName' => $this->original_name,
            'mimeType' => $this->mime_type,
            'isPdf' => $this->isPdf(),
            'failureReason' => $this->failure_reason,
            'confirmedAt' => $this->confirmed_at,
            'createdAt' => $this->created_at,
            'itemsCount' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item): array => [
                'id' => $item->id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'amount' => $item->amount,
                'categoryId' => $item->category_id,
            ])),
            'transactions' => $this->whenLoaded('transactions', fn () => $this->transactions->map(fn ($transaction): array => [
                'id' => $transaction->id,
                'amount' => $transaction->amount,
                'categoryId' => $transaction->category_id,
                'categoryName' => $transaction->category?->name,
                'notes' => $transaction->notes,
            ])),
        ];
    }
}
