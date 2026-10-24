<?php

namespace App\Models;

use Database\Factories\ReceiptItemFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptItem extends Model
{
    /** @use HasFactory<ReceiptItemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'receipt_id',
        'category_id',
        'description',
        'quantity',
        'amount',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'amount' => 'integer',
            'position' => 'integer',
        ];
    }

    /*
    * Relationships
    */

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
