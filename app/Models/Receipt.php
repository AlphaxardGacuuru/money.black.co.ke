<?php

namespace App\Models;

use Database\Factories\ReceiptFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Receipt extends Model
{
    /** @use HasFactory<ReceiptFactory> */
    use HasFactory, HasUuids;

    /**
     * The receipt is being read by the AI scanner.
     */
    public const STATUS_PROCESSING = 'processing';

    /**
     * The receipt was read and is waiting for the user to confirm it.
     */
    public const STATUS_REVIEW = 'review';

    /**
     * The user confirmed the receipt and its transactions were created.
     */
    public const STATUS_CONFIRMED = 'confirmed';

    /**
     * The receipt could not be read.
     */
    public const STATUS_FAILED = 'failed';

    /**
     * Uploaded and waiting for a queue worker to pick it up.
     */
    public const STEP_QUEUED = 'queued';

    /**
     * Loading the file and the user's categories.
     */
    public const STEP_PREPARING = 'preparing';

    /**
     * Waiting on the AI provider to read the receipt.
     */
    public const STEP_READING = 'reading';

    /**
     * Matching the extracted items to categories and saving them.
     */
    public const STEP_SORTING = 'sorting';

    /**
     * An attempt failed and the job will run again after a short wait.
     */
    public const STEP_RETRYING = 'retrying';

    /**
     * The disk receipt files are stored on (private, not web-accessible).
     */
    public const DISK = 'local';

    protected $fillable = [
        'user_id',
        'account_id',
        'path',
        'original_name',
        'mime_type',
        'file_hash',
        'status',
        'processing_step',
        'processing_attempt',
        'processing_step_at',
        'merchant',
        'receipt_date',
        'currency',
        'total',
        'tax',
        'discount',
        'extraction',
        'failure_reason',
        'confirmed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'receipt_date' => 'date',
            'total' => 'integer',
            'tax' => 'integer',
            'discount' => 'integer',
            'extraction' => 'array',
            'confirmed_at' => 'datetime',
            'processing_attempt' => 'integer',
            'processing_step_at' => 'datetime',
        ];
    }

    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    public function isEditable(): bool
    {
        return in_array($this->status, [self::STATUS_REVIEW, self::STATUS_FAILED], true);
    }

    /**
     * Record which step of the scan the receipt has reached, so the app can show progress.
     */
    public function moveToStep(string $step, ?int $attempt = null): void
    {
        $this->update([
            'processing_step' => $step,
            'processing_attempt' => $attempt ?? $this->processing_attempt,
            'processing_step_at' => now(),
        ]);
    }

    /*
    * Relationships
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReceiptItem::class)->orderBy('position');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
