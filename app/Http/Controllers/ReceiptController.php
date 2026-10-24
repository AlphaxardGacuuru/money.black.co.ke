<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConfirmReceiptRequest;
use App\Http\Resources\ReceiptResource;
use App\Http\Services\ReceiptService;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReceiptController extends Controller
{
    /**
     * Image and PDF types the scanner can read.
     */
    public const ACCEPTED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
    ];

    public function __construct(protected ReceiptService $service) {}

    /**
     * List the user's receipts, newest first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $receipts = Receipt::query()
            ->where('user_id', $request->user()->id)
            ->withCount('items')
            ->latest()
            ->paginate(20);

        return ReceiptResource::collection($receipts);
    }

    /**
     * Upload a receipt photo or PDF and queue it for scanning.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimetypes:' . implode(',', self::ACCEPTED_MIME_TYPES), 'max:10240'],
        ], [
            'file.mimetypes' => __('Upload a photo (JPG, PNG, WEBP, HEIC) or a PDF.'),
            'file.max' => __('The file must be 10 MB or smaller.'),
        ]);

        $receipt = $this->service->upload($request->user(), $request->file('file'));

        return (new ReceiptResource($receipt))
            ->additional(['message' => __('Receipt uploaded. Reading it now…')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show a receipt with its line items.
     */
    public function show(Receipt $receipt): ReceiptResource
    {
        $this->authorize('view', $receipt);

        return new ReceiptResource($receipt->load(['items', 'transactions.category']));
    }

    /**
     * Stream the stored receipt file to its owner.
     */
    public function file(Receipt $receipt): StreamedResponse
    {
        $this->authorize('view', $receipt);

        return Storage::disk(Receipt::DISK)->response($receipt->path, $receipt->original_name, [
            'Content-Type' => $receipt->mime_type,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Save the reviewed items and create the transactions.
     */
    public function confirm(ConfirmReceiptRequest $request, Receipt $receipt): ReceiptResource
    {
        $receipt = $this->service->confirm($receipt, $request->validated());

        return (new ReceiptResource($receipt))->additional([
            'message' => trans_choice('{1} Added :count transaction.|[2,*] Added :count transactions.', $receipt->transactions->count()),
        ]);
    }

    /**
     * Scan a failed receipt again.
     */
    public function retry(Receipt $receipt): ReceiptResource
    {
        $this->authorize('update', $receipt);

        if ($receipt->status !== Receipt::STATUS_FAILED) {
            throw ValidationException::withMessages(['receipt' => __('Only receipts that failed to scan can be retried.')]);
        }

        return new ReceiptResource($this->service->retry($receipt));
    }

    /**
     * Delete a receipt. Transactions already created from it are kept.
     */
    public function destroy(Receipt $receipt): JsonResponse
    {
        $this->authorize('delete', $receipt);

        $this->service->delete($receipt);

        return response()->json(['message' => __('Receipt deleted.')]);
    }
}
