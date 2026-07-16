<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class OneMoneyImportControllerTest extends TestCase
{
    use RefreshDatabase;

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('statement.csv', $content);
    }

    public function test_guests_cannot_import()
    {
        $user = User::factory()->create();

        $this->post(route('imports.one-money.store'), [
            'file' => $this->csv("FromAccount,ToAccount,Amount,Currency,Type,Notes,Date\n"),
        ], ['Accept' => 'application/json'])->assertUnauthorized();
    }

    public function test_it_requires_a_file()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('imports.one-money.store'), []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('file');
    }

    public function test_it_rejects_unsupported_file_types()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => UploadedFile::fake()->create('statement.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json']);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('file');
    }

    public function test_it_imports_transactions_and_creates_accounts_and_categories()
    {
        $user = User::factory()->create();

        $content = "FromAccount,ToAccount,Amount,Currency,Type,Notes,Date\n"
            ."Bank,Food,500,KES,Expense,Lunch,2026-01-05\n"
            ."Bank,Salary,10000,KES,Income,Pay,2026-01-01\n";

        $response = $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => $this->csv($content),
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('summary.rows', 2);
        $response->assertJsonPath('summary.imported', 2);
        $response->assertJsonPath('summary.duplicates', 0);
        $response->assertJsonPath('summary.skipped', 0);
        $response->assertJsonPath('summary.createdAccounts', 1);
        $response->assertJsonPath('summary.createdCategories', 2);

        $this->assertDatabaseHas('accounts', ['user_id' => $user->id, 'name' => 'Bank']);
        $this->assertDatabaseHas('categories', ['user_id' => $user->id, 'name' => 'Food', 'type' => 'expense']);
        $this->assertDatabaseHas('categories', ['user_id' => $user->id, 'name' => 'Salary', 'type' => 'income']);
        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_it_does_not_reimport_duplicate_rows()
    {
        $user = User::factory()->create();

        $content = "FromAccount,ToAccount,Amount,Currency,Type,Notes,Date\n"
            ."Bank,Food,500,KES,Expense,Lunch,2026-01-05\n";

        $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => $this->csv($content),
        ])->assertOk();

        $response = $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => $this->csv($content),
        ]);

        $response->assertOk();
        $response->assertJsonPath('summary.imported', 0);
        $response->assertJsonPath('summary.duplicates', 1);
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_it_skips_rows_missing_required_fields()
    {
        $user = User::factory()->create();

        $content = "FromAccount,ToAccount,Amount,Currency,Type,Notes,Date\n"
            .",Food,500,KES,Expense,Lunch,2026-01-05\n";

        $response = $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => $this->csv($content),
        ]);

        $response->assertOk();
        $response->assertJsonPath('summary.skipped', 1);
        $response->assertJsonPath('summary.imported', 0);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_it_reports_no_importable_rows_for_an_empty_file()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('imports.one-money.store'), [
            'file' => $this->csv(''),
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', false);
        $response->assertJsonPath('summary.rows', 0);
    }
}
