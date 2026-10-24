<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfirmReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('receipt'));
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'account_id' => ['required', 'string', Rule::exists('accounts', 'id')->where('user_id', $userId)],
            'merchant' => ['nullable', 'string', 'max:255'],
            'receipt_date' => ['required', 'date', 'before_or_equal:today'],
            'total' => ['required', 'integer', 'min:1'],
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0'],
            'items.*.amount' => ['required', 'integer', 'min:1'],
            'items.*.category_id' => [
                'required',
                'string',
                Rule::exists('categories', 'id')->where('user_id', $userId)->where('type', 'expense'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.*.category_id.required' => __('Choose a category for every item.'),
            'items.*.category_id.exists' => __('Choose one of your expense categories.'),
        ];
    }
}
