<?php

namespace App\Models;

use Database\Factories\MonthlySummaryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An AI-written summary of a user's spending for one month. The figures in
 * `stats` are calculated in PHP; the AI only puts them into words.
 */
class MonthlySummary extends Model
{
    /** @use HasFactory<MonthlySummaryFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'period',
        'headline',
        'summary',
        'stats',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stats' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
