<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompensateReceiptRequest extends FormRequest
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
            'category_id' => [
                'required',
                'string',
                Rule::exists('categories', 'id')->where('user_id', $userId)->where('type', 'income'),
            ],
            'amount' => ['required', 'integer', 'min:1'],
            'compensation_date' => ['required', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:250'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.exists' => __('Choose one of your income categories.'),
        ];
    }
}
