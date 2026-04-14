<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('categories.store'), [
            'icon' => 'food',
            'color' => '#000000',
            'name' => 'Groceries',
            'type' => 'expense',
        ]);

        $response->assertRedirect(route('categories.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Category Created Successfully');
    }

    public function test_update_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = new Category;
        $category->user_id = $user->id;
        $category->icon = 'food';
        $category->color = '#000000';
        $category->name = 'Groceries';
        $category->type = 'expense';
        $category->save();

        $response = $this->put(route('categories.update', $category), [
            'name' => 'Transport',
        ]);

        $response->assertRedirect(route('categories.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', 'Category Updated Successfully');
    }

    public function test_destroy_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = new Category;
        $category->user_id = $user->id;
        $category->icon = 'food';
        $category->color = '#000000';
        $category->name = 'Groceries';
        $category->type = 'expense';
        $category->save();

        $response = $this->delete(route('categories.destroy', $category));

        $response->assertRedirect(route('categories.index'))
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', $category->name . ' Deleted Successfully');
    }
}
