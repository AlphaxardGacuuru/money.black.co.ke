<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class OneMoneyImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_import_one_money_tabular_export_from_uploaded_file(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $fileContents = implode("\n", [
            "DATE\tTYPE\tFROM ACCOUNT\tTO ACCOUNT\tAMOUNT\tCURRENCY\tAMOUNT 2\tCURRENCY\tTAGS\tNOTES",
            "14-04-26\tExpense\tCash\tBills\t1000\tKES\t1000\tKES\t\tSafaricom",
            "14-04-26\tExpense\tCash\tBills\t2273\tKES\t2273\tKES\t\tDigital Ocean",
        ]);

        $file = UploadedFile::fake()->createWithContent('one-money-export.txt', $fileContents);

        $response = $this->post('/api/imports/one-money', [
            'file' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('summary.rows', 2)
            ->assertJsonPath('summary.imported', 2)
            ->assertJsonPath('summary.createdAccounts', 1)
            ->assertJsonPath('summary.createdCategories', 1);

        $this->assertDatabaseCount('accounts', 1);
        $this->assertDatabaseCount('categories', 1);
        $this->assertDatabaseCount('transactions', 2);

        $account = Account::query()->where('user_id', $user->id)->where('name', 'Cash')->firstOrFail();
        $category = Category::query()->where('user_id', $user->id)->where('name', 'Bills')->firstOrFail();

        $this->assertSame('expense', $category->type);
        $this->assertSame(3273, $category->total);
        $this->assertSame(-3273, $account->balance);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 1000,
            'currency' => 'KES',
            'notes' => 'Safaricom',
        ]);

        $this->assertSame(2, Transaction::query()->where('user_id', $user->id)->count());
    }
}
