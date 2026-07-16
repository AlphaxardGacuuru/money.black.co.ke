<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OverviewControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_the_overview()
    {
        $this->getJson(route('api.overview.index'))->assertUnauthorized();
    }

    public function test_it_totals_income_and_expense_categories_separately()
    {
        $user = User::factory()->create();

        Category::factory()->for($user)->expense()->create(['total' => 300]);
        Category::factory()->for($user)->expense()->create(['total' => 200]);
        Category::factory()->for($user)->income()->create(['total' => 1000]);

        $response = $this->actingAs($user)->getJson(route('api.overview.index'));

        $response->assertOk();
        $response->assertJsonPath('totals.expense', 500);
        $response->assertJsonPath('totals.income', 1000);
        $response->assertJsonPath('totals.net', 500);
        $response->assertJsonCount(3, 'data');
    }

    public function test_it_only_totals_the_authenticated_users_categories()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Category::factory()->for($user)->expense()->create(['total' => 100]);
        Category::factory()->for($otherUser)->expense()->create(['total' => 900]);

        $response = $this->actingAs($user)->getJson(route('api.overview.index'));

        $response->assertOk();
        $response->assertJsonPath('totals.expense', 100);
        $response->assertJsonCount(1, 'data');
    }

    public function test_categories_are_sorted_by_total_descending()
    {
        $user = User::factory()->create();

        Category::factory()->for($user)->expense()->create(['name' => 'Small', 'total' => 50]);
        Category::factory()->for($user)->expense()->create(['name' => 'Large', 'total' => 500]);

        $response = $this->actingAs($user)->getJson(route('api.overview.index'));

        $response->assertOk();
        $response->assertJsonPath('data.0.name', 'Large');
        $response->assertJsonPath('data.1.name', 'Small');
    }
}
