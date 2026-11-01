<?php

namespace App\Http\Resources;

use App\Support\AppLock;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'home_page' => $this->homePage(),
            'can_view_telescope' => config('telescope.enabled') && Gate::forUser($this->resource)->allows('viewTelescope'),
            'can_view_horizon' => Gate::forUser($this->resource)->allows('viewHorizon'),
            'can_view_pulse' => Gate::forUser($this->resource)
                ->allows('viewPulse'),
            'can_view_ai_usage' => Gate::forUser($this->resource)->allows('viewAiUsage'),
            'app_lock_enabled' => (bool) ($this->settings?->app_lock ?? false),
            'app_locked' => AppLock::for($this->resource)->isLocked(),
        ];
    }
}
