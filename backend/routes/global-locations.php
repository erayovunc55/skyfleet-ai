<?php

use App\Http\Controllers\Api\GlobalLocationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'panel.role:dispatcher,admin,super_admin'])
    ->get('locations', [GlobalLocationController::class, 'index']);
