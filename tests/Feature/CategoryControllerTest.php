<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders(['X-Requested-With' => 'XMLHttpRequest']);
    }

    public function test_guests_cannot_access_categories()
    {
        $this->getJson(route('api.categories.index'))->assertUnauthorized();
    }

    public function test_it_lists_only_the_authenticated_users_categories()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Category::factory()->for($user)->create(['name' => 'Mine']);
        Category::factory()->for($otherUser)->create(['name' => 'Not Mine']);

        $response = $this->actingAs($user)->getJson(route('api.categories.index'));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Mine');
    }

    public function test_it_orders_categories_by_position()
    {
        $user = User::factory()->create();

        $second = Category::factory()->for($user)->create(['position' => 2, 'name' => 'Second']);
        $first = Category::factory()->for($user)->create(['position' => 1, 'name' => 'First']);

        $response = $this->actingAs($user)->getJson(route('api.categories.index'));

        $response->assertOk();
        $response->assertJsonPath('data.0.name', 'First');
        $response->assertJsonPath('data.1.name', 'Second');
    }

    public function test_it_returns_id_and_name_only_when_requested()
    {
        $user = User::factory()->create();

        Category::factory()->for($user)->create(['name' => 'Food']);

        $response = $this->actingAs($user)->getJson(route('api.categories.index', ['idAndName' => 1]));

        $response->assertOk();
        $response->assertJsonStructure(['data' => [['id', 'name']]]);
    }

    public function test_it_creates_a_category()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('categories.store'), [
            'icon' => 'utensils',
            'color' => '#ea580c',
            'name' => 'Food',
            'type' => 'expense',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Food');

        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'name' => 'Food',
            'type' => 'expense',
        ]);
    }

    public function test_categories_are_appended_to_the_end_of_the_position_order()
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create();
        Category::factory()->for($user)->create();

        $response = $this->actingAs($user)->postJson(route('categories.store'), [
            'icon' => 'tags',
            'color' => '#1d4ed8',
            'name' => 'Third',
            'type' => 'expense',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('categories', [
            'name' => 'Third',
            'position' => 3,
        ]);
    }

    public function test_creating_a_category_requires_icon_color_name_and_type()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('categories.store'), []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['icon', 'color', 'name', 'type']);
    }

    public function test_creating_a_category_rejects_an_invalid_type()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('categories.store'), [
            'icon' => 'tags',
            'color' => '#1d4ed8',
            'name' => 'Food',
            'type' => 'not-a-real-type',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('type');
    }

    public function test_a_user_cannot_create_two_categories_with_the_same_name()
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->create(['name' => 'Food']);

        $this->withoutExceptionHandling();
        $this->expectException(\Illuminate\Database\QueryException::class);

        $this->actingAs($user)->postJson(route('categories.store'), [
            'icon' => 'tags',
            'color' => '#1d4ed8',
            'name' => 'Food',
            'type' => 'expense',
        ]);
    }

    public function test_it_shows_a_single_category()
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create();

        $response = $this->actingAs($user)->getJson(route('categories.show', $category));

        $response->assertOk();
        $response->assertJsonPath('data.id', $category->id);
    }

    public function test_it_cannot_show_another_users_category()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $category = Category::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->getJson(route('categories.show', $category));

        $response->assertNotFound();
    }

    public function test_it_updates_a_category()
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create(['name' => 'Old Name']);

        $response = $this->actingAs($user)->putJson(route('categories.update', $category), [
            'name' => 'New Name',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'New Name');
    }

    public function test_it_cannot_update_another_users_category()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $category = Category::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->putJson(route('categories.update', $category), [
            'name' => 'Hijacked',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('categories', ['id' => $category->id, 'name' => 'Hijacked']);
    }

    public function test_it_deletes_a_category()
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->create();

        $response = $this->actingAs($user)->deleteJson(route('categories.destroy', $category));

        $response->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_it_cannot_delete_another_users_category()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $category = Category::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->deleteJson(route('categories.destroy', $category));

        $response->assertNotFound();
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
