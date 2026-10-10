<?php

namespace App\Providers;

use App\Models\Transfer;
use App\Observers\TransferObserver;
use App\Support\ResendHttpTransport;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Mail::extend('resend-http', fn (array $config) => new ResendHttpTransport($config['key'] ?? null));

        Transfer::observe(TransferObserver::class);
    }
}
