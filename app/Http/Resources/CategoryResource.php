<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
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
            'icon' => $this->icon,
            'color' => $this->color,
            'name' => $this->name,
            'type' => $this->type,
            'currency' => $this->currency,
            'total' => [
                'amount' => $this->total,
                'formatted' => number_format($this->total, 2),
            ],
            'createdAt' => $this->created_at,
        ];
    }
}
