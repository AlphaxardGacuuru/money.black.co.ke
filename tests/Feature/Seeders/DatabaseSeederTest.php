<?php

namespace Tests\Feature\Seeders;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
	use RefreshDatabase;

	public function test_database_seeder_creates_data_for_all_models_and_transactions_start_from_beginning_of_year(): void
	{
		$this->seed();

		$this->assertGreaterThan(0, Account::query()->count());
		$this->assertGreaterThan(0, Category::query()->count());
		$this->assertGreaterThan(0, Transaction::query()->count());

		$startOfYear = CarbonImmutable::now()->startOfYear();
		$now = CarbonImmutable::now();

		$earliestTransactionDate = Transaction::query()->min('transaction_date');
		$latestTransactionDate = Transaction::query()->max('transaction_date');

		$this->assertNotNull($earliestTransactionDate);
		$this->assertNotNull($latestTransactionDate);
		$this->assertGreaterThanOrEqual(
			$startOfYear->timestamp,
			CarbonImmutable::parse($earliestTransactionDate)->timestamp
		);
		$this->assertLessThanOrEqual(
			$now->timestamp,
			CarbonImmutable::parse($latestTransactionDate)->timestamp
		);
	}
}
