<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function() {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('categories:suggest')
    ->monthlyOn(1, '07:00')
    ->withoutOverlapping()
    ->onOneServer();
