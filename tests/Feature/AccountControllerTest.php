<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_guests_cannot_access_accounts()
    {
        $this->getJson(route('api.accounts.index'))->assertUnauthorized();
    }

    public function test_it_lists_only_the_authenticated_users_accounts()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Account::factory()->for($user)->create(['name' => 'Mine']);
        Account::factory()->for($otherUser)->create(['name' => 'Not Mine']);

        $response = $this->actingAs($user)->getJson(route('api.accounts.index'));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Mine');
    }

    public function test_it_filters_accounts_by_name()
    {
        $user = User::factory()->create();

        Account::factory()->for($user)->create(['name' => 'Bank']);
        Account::factory()->for($user)->create(['name' => 'Cash']);

        $response = $this->actingAs($user)->getJson(route('api.accounts.index', ['name' => 'Ban']));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Bank');
    }

    public function test_it_returns_id_and_name_only_when_requested()
    {
        $user = User::factory()->create();

        Account::factory()->for($user)->create(['name' => 'Bank']);

        $response = $this->actingAs($user)->getJson(route('api.accounts.index', ['idAndName' => 1]));

        $response->assertOk();
        $response->assertJsonStructure(['data' => [['id', 'name']]]);
    }

    public function test_it_creates_an_account()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('accounts.store'), [
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => 'Bank',
            'currency' => 'KES',
            'type' => 'regular',
            'description' => 'My bank account',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Bank');
        $response->assertJsonPath('data.isDefault', true);

        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'name' => 'Bank',
            'is_default' => true,
        ]);
    }

    public function test_the_first_account_becomes_default_automatically()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('accounts.store'), [
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => 'First',
        ])->assertJsonPath('data.isDefault', true);
    }

    public function test_marking_a_new_account_as_default_unsets_the_previous_default()
    {
        $user = User::factory()->create();
        $existingDefault = Account::factory()->for($user)->default()->create();

        $this->actingAs($user)->postJson(route('accounts.store'), [
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => 'New Default',
            'isDefault' => true,
        ])->assertCreated();

        $this->assertFalse((bool) $existingDefault->fresh()->is_default);
    }

    public function test_creating_an_account_requires_icon_color_and_name()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('accounts.store'), []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['icon', 'color', 'name']);
    }

    public function test_creating_an_account_rejects_an_invalid_type()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('accounts.store'), [
            'icon' => 'wallet',
            'color' => '#111827',
            'name' => 'Bank',
            'type' => 'not-a-real-type',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('type');
    }

    public function test_it_shows_a_single_account()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $response = $this->actingAs($user)->getJson(route('accounts.show', $account));

        $response->assertOk();
        $response->assertJsonPath('data.id', $account->id);
    }

    public function test_it_cannot_show_another_users_account()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->getJson(route('accounts.show', $account));

        $response->assertNotFound();
    }

    public function test_it_updates_an_account()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create(['name' => 'Old Name']);

        $response = $this->actingAs($user)->putJson(route('accounts.update', $account), [
            'name' => 'New Name',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('accounts', [
            'id' => $account->id,
            'name' => 'New Name',
        ]);
    }

    public function test_it_cannot_update_another_users_account()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->putJson(route('accounts.update', $account), [
            'name' => 'Hijacked',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('accounts', ['id' => $account->id, 'name' => 'Hijacked']);
    }

    public function test_it_deletes_an_account()
    {
        $user = User::factory()->create();
        $account = Account::factory()->for($user)->create();

        $response = $this->actingAs($user)->deleteJson(route('accounts.destroy', $account));

        $response->assertOk();
        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
    }

    public function test_it_cannot_delete_another_users_account()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $account = Account::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->deleteJson(route('accounts.destroy', $account));

        $response->assertNotFound();
        $this->assertDatabaseHas('accounts', ['id' => $account->id]);
    }
}
