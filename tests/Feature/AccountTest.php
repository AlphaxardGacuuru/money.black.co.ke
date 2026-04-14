<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('accounts.store'), [
            'icon' => 'wallet',
            'color' => '#000000',
            'name' => 'Savings',
            'currency' => 'KES',
            'type' => 'regular',
            'is_default' => false,
        ]);

        $response->assertRedirect(route('accounts.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Account Created Successfully');
    }

    public function test_update_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = new Account;
        $account->user_id = $user->id;
        $account->icon = 'wallet';
        $account->color = '#000000';
        $account->name = 'Savings';
        $account->type = 'regular';
        $account->save();

        $response = $this->put(route('accounts.update', $account), [
            'name' => 'Updated Savings',
        ]);

        $response->assertRedirect(route('accounts.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Account Updated Successfully');
    }

    public function test_destroy_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = new Account;
        $account->user_id = $user->id;
        $account->icon = 'wallet';
        $account->color = '#000000';
        $account->name = 'Savings';
        $account->type = 'regular';
        $account->save();

        $response = $this->delete(route('accounts.destroy', $account));

        $response->assertRedirect(route('accounts.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', $account->name . ' Deleted Successfully');
    }
}
