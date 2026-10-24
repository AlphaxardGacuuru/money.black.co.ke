<?php

namespace App\Models;

use Database\Factories\CategorySuggestionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A monthly AI suggestion to add a category or rename an existing one.
 * Nothing changes until the user accepts it.
 */
class CategorySuggestion extends Model
{
    /** @use HasFactory<CategorySuggestionFactory> */
    use HasFactory, HasUuids;

    public const ACTION_ADD = 'add';

    public const ACTION_RENAME = 'rename';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_DISMISSED = 'dismissed';

    protected $fillable = [
        'user_id',
        'category_id',
        'action',
        'name',
        'type',
        'icon',
        'color',
        'reason',
        'status',
        'period',
        'resolved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /*
    * Relationships
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
