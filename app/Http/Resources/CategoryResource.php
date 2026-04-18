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
        $attributes = $this->resource->getAttributes();
        
        $hasComputedTotal = array_key_exists('computed_total', $attributes);

        $computedTotal = $hasComputedTotal
            ? (int) ($this->computed_total ?? 0)
            : (int) $this->total;

        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'icon' => $this->icon,
            'color' => $this->color,
            'name' => $this->name,
            'type' => $this->type,
            'currency' => $this->currency,
            'total' => [
                'amount' => (int) $computedTotal,
                'formatted' => number_format((int) $computedTotal, 2),
            ],
            'createdAt' => $this->created_at,
        ];
    }
}
