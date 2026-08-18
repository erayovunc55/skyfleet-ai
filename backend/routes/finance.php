<?php

use App\Http\Controllers\Api\FinanceBulkController;
use App\Http\Controllers\Api\FinanceController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'panel.role:dispatcher,admin,super_admin',
])
    ->prefix('admin/finance')
    ->group(function () {
        Route::get(
            '/',
            [
                FinanceController::class,
                'index',
            ]
        );

        Route::post(
            'synchronize',
            [
                FinanceController::class,
                'synchronize',
            ]
        );

        /*
         * Toplu hakediş işlemleri.
         */
        Route::post(
            'bulk-approve',
            [
                FinanceBulkController::class,
                'approve',
            ]
        );

        Route::post(
            'bulk-paid',
            [
                FinanceBulkController::class,
                'markPaid',
            ]
        );

        Route::get(
            '{financial}',
            [
                FinanceController::class,
                'show',
            ]
        );

        Route::patch(
            '{financial}/approve',
            [
                FinanceController::class,
                'approve',
            ]
        );

        Route::patch(
            '{financial}/paid',
            [
                FinanceController::class,
                'markPaid',
            ]
        );

        Route::patch(
            '{financial}/dispute',
            [
                FinanceController::class,
                'dispute',
            ]
        );
    });