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
            'user_id' => $this->user_id,
            'icon' => $this->icon,
            'color' => $this->color,
            'name' => $this->name,
            'type' => $this->type,
            'total' => $this->total,
            'created_at' => $this->created_at,
        ];
    }
}
