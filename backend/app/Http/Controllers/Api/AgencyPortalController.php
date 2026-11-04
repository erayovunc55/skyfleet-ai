<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyPortalController extends Controller
{
    public function profile(
        Request $request
    ): JsonResponse {
        $user = $request
            ->user()
            ?->load('agencyCompany');

        if (
            !$user
            ||
            !$user->isAgencyUser()
            ||
            !$user->agencyCompany
        ) {
            return response()->json([
                'message' =>
                    'Acenta hesabına erişim yetkiniz yok.',
            ], 403);
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' =>
                        $user->id,

                    'name' =>
                        $user->name,

                    'email' =>
                        $user->email,

                    'phone' =>
                        $user->phone,

                    'role' =>
                        $user->role,
                ],

                'agency' => [
                    'id' =>
                        $user->agencyCompany->id,

                    'company_name' =>
                        $user->agencyCompany->company_name,

                    'legal_name' =>
                        $user->agencyCompany->legal_name,

                    'email' =>
                        $user->agencyCompany->email,

                    'phone' =>
                        $user->agencyCompany->phone,

                    'website' =>
                        $user->agencyCompany->website,

                    'country_code' =>
                        $user->agencyCompany->country_code,

                    'country_name' =>
                        $user->agencyCompany->country_name,

                    'city' =>
                        $user->agencyCompany->city,

                    'default_currency' =>
                        $user->agencyCompany->default_currency,

                    'discount_percent' =>
                        $user->agencyCompany->discount_percent,

                    'status' =>
                        $user->agencyCompany->status,

                    'is_active' =>
                        $user->agencyCompany->is_active,
                ],
            ],
        ]);
    }

    public function dashboard(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        if (
            !$user
            ||
            !$user->isAgencyUser()
        ) {
            return response()->json([
                'message' =>
                    'Acenta hesabına erişim yetkiniz yok.',
            ], 403);
        }

        $agencyId =
            $user->agency_id;

        $query = Transfer::query()
            ->where(
                'agency_id',
                $agencyId
            );

        $todayStart =
            now()->startOfDay();

        $todayEnd =
            now()->endOfDay();

        return response()->json([
            'data' => [
                'total_transfers' =>
                    (clone $query)->count(),

                'pending_transfers' =>
                    (clone $query)
                        ->where(
                            'status',
                            'pending'
                        )
                        ->count(),

                'active_transfers' =>
                    (clone $query)
                        ->whereIn(
                            'status',
                            [
                                'accepted',
                                'on_the_way',
                                'arrived',
                                'passenger_called',
                                'passenger_on_board',
                                'trip_started',
                            ]
                        )
                        ->count(),

                'completed_transfers' =>
                    (clone $query)
                        ->where(
                            'status',
                            'completed'
                        )
                        ->count(),

                'today_transfers' =>
                    (clone $query)
                        ->whereBetween(
                            'pickup_time',
                            [
                                $todayStart,
                                $todayEnd,
                            ]
                        )
                        ->count(),

                'upcoming_transfers' =>
                    (clone $query)
                        ->where(
                            'pickup_time',
                            '>=',
                            now()
                        )
                        ->whereNotIn(
                            'status',
                            [
                                'completed',
                                'cancelled',
                                'no_show',
                            ]
                        )
                        ->orderBy(
                            'pickup_time'
                        )
                        ->limit(5)
                        ->get([
                            'id',
                            'booking_reference',
                            'passenger_name',
                            'pickup',
                            'dropoff',
                            'pickup_time',
                            'vehicle_type',
                            'status',
                            'price',
                            'currency',
                        ]),
            ],
        ]);
    }
}