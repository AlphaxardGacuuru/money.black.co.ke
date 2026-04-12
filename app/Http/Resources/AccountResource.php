<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
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
            'icon' => $this->icon,
            'color' => $this->color,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'currency' => $this->currency,
            'isDefault' => $this->is_default,
            'balance' => $this->balance,
            'created_at' => $this->created_at,
        ];
    }
}
