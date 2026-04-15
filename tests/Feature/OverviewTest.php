<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_overview_shows_cumulative_totals_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $this->actingAs($user);

        $expenseCategory = new Category;
        $expenseCategory->user_id = $user->id;
        $expenseCategory->icon = 'utensils';
        $expenseCategory->color = '#000000';
        $expenseCategory->name = 'Food';
        $expenseCategory->type = 'expense';
        $expenseCategory->total = 1250;
        $expenseCategory->save();

        $incomeCategory = new Category;
        $incomeCategory->user_id = $user->id;
        $incomeCategory->icon = 'briefcase';
        $incomeCategory->color = '#111111';
        $incomeCategory->name = 'Salary';
        $incomeCategory->type = 'income';
        $incomeCategory->total = 5000;
        $incomeCategory->save();

        $otherUsersCategory = new Category;
        $otherUsersCategory->user_id = $otherUser->id;
        $otherUsersCategory->icon = 'wallet';
        $otherUsersCategory->color = '#222222';
        $otherUsersCategory->name = 'Other';
        $otherUsersCategory->type = 'expense';
        $otherUsersCategory->total = 9999;
        $otherUsersCategory->save();

        $response = $this->get(route('overview'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('overview/index')
                ->has('categories.data', 2)
                ->where('totals.expense', 1250)
                ->where('totals.income', 5000)
                ->where('totals.net', 3750));

        $this->assertNotEquals($otherUsersCategory->id, $expenseCategory->id);
    }
}
