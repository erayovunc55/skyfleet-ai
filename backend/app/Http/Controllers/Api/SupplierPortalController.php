<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierPortalController extends Controller
{
    public function profile(
        Request $request
    ): JsonResponse {
        [
            $user,
            $supplier,
        ] = $this->resolveSupplierUser(
            $request
        );

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                ],

                'supplier' => [
                    'id' => $supplier->id,
                    'company_name' =>
                        $supplier->company_name,

                    'contact_name' =>
                        $supplier->contact_name,

                    'email' =>
                        $supplier->email,

                    'phone' =>
                        $supplier->phone,

                    'country_code' =>
                        $supplier->country_code,

                    'country_name' =>
                        $supplier->country_name,

                    'city' =>
                        $supplier->city,

                    'timezone' =>
                        $supplier->timezone,

                    'default_currency' =>
                        $supplier->default_currency,

                    'status' =>
                        $supplier->status,

                    'is_active' =>
                        $supplier->is_active,
                ],
            ],
        ]);
    }

    public function transfers(
        Request $request
    ): JsonResponse {
        [
            $user,
            $supplier,
        ] = $this->resolveSupplierUser(
            $request
        );

        $validated = $request->validate([
            'status' => [
                'nullable',
                'string',

                Rule::in([
                    'pending',
                    'accepted',
                    'on_the_way',
                    'arrived',
                    'passenger_called',
                    'passenger_on_board',
                    'trip_started',
                    'completed',
                    'no_show',
                    'cancelled',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:date_from',
            ],

            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = Transfer::query()
            ->where(
                'supplier_id',
                $supplier->id
            )
            ->with([
                'driver:id,name,phone,vehicle_id',
                'driver.vehicle',
                'pickupLocation',
                'pickupPoint',
                'dropoffLocation',
                'dropoffPoint',
                'latestEvent',
                'latestLocation',
            ]);

        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate(
                'pickup_time',
                '>=',
                $validated['date_from']
            );
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate(
                'pickup_time',
                '<=',
                $validated['date_to']
            );
        }

        if (!empty($validated['search'])) {
            $this->applySearch(
                $query,
                trim(
                    $validated['search']
                )
            );
        }

        $transfers = $query
            ->orderBy('pickup_time')
            ->paginate(
                $validated['per_page'] ?? 25
            );

        $transfers->through(
            fn (Transfer $transfer): array =>
                $this->formatTransfer(
                    $transfer,
                    $supplier
                )
        );

        return response()->json(
            $transfers
        );
    }

    public function show(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        [
            $user,
            $supplier,
        ] = $this->resolveSupplierUser(
            $request
        );

        if (
            (int) $transfer->supplier_id
            !==
            (int) $supplier->id
        ) {
            abort(
                404,
                'Transfer bulunamadı.'
            );
        }

        $transfer->load([
            'driver:id,name,phone,vehicle_id',
            'driver.vehicle',
            'pickupLocation',
            'pickupPoint',
            'dropoffLocation',
            'dropoffPoint',
            'events',
            'latestEvent',
            'latestLocation',
        ]);

        return response()->json([
            'data' =>
                $this->formatTransfer(
                    $transfer,
                    $supplier,
                    includeDetails: true
                ),
        ]);
    }

    private function resolveSupplierUser(
        Request $request
    ): array {
        /** @var User|null $user */
        $user = $request->user();

        if (
            !$user
            || $user->role !== 'supplier'
            || !$user->is_active
        ) {
            abort(
                403,
                'Bu alan yalnızca aktif tedarikçi kullanıcıları içindir.'
            );
        }

        if (!$user->supplier_id) {
            abort(
                403,
                'Kullanıcı hesabı bir tedarikçi şirketine bağlı değil.'
            );
        }

        $supplier = Supplier::query()
            ->find($user->supplier_id);

        if (!$supplier) {
            abort(
                403,
                'Tedarikçi şirketi bulunamadı.'
            );
        }

        if (!$supplier->canOperate()) {
            abort(
                403,
                'Tedarikçi hesabı henüz operasyon kullanımına açık değil.'
            );
        }

        return [
            $user,
            $supplier,
        ];
    }

    private function applySearch(
        Builder $query,
        string $search
    ): void {
        $query->where(
            function (
                Builder $searchQuery
            ) use ($search): void {
                $searchQuery
                    ->where(
                        'booking_reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'passenger_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'passenger_phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'flight_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'pickup',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'dropoff',
                        'like',
                        "%{$search}%"
                    );
            }
        );
    }

    private function formatTransfer(
        Transfer $transfer,
        Supplier $supplier,
        bool $includeDetails = false
    ): array {
        $supplierAmount =
            $supplier
                ->calculatePayableAmount(
                    $transfer->getRawOriginal(
                        'price'
                    )
                );

        $data = [
            'id' =>
                $transfer->id,

            'booking_reference' =>
                $transfer->booking_reference,

            /*
             * Ana satış fiyatı gönderilmez.
             * Yalnızca tedarikçinin net
             * alacağı tutar gönderilir.
             */
            'supplier_amount' =>
                number_format(
                    $supplierAmount,
                    2,
                    '.',
                    ''
                ),

            'currency' =>
                $transfer->getRawOriginal(
                    'currency'
                )
                ?: $supplier->default_currency
                ?: 'EUR',

            'passenger_name' =>
                $transfer->passenger_name,

            'passenger_phone' =>
                $transfer->passenger_phone,

            'passenger_email' =>
                $transfer->passenger_email,

            'flight_number' =>
                $transfer->flight_number,

            'airline' =>
                $transfer->airline,

            'terminal' =>
                $transfer->terminal,

            'pickup' =>
                $transfer->pickup,

            'pickup_lat' =>
                $transfer->pickup_lat,

            'pickup_lng' =>
                $transfer->pickup_lng,

            'dropoff' =>
                $transfer->dropoff,

            'dropoff_lat' =>
                $transfer->dropoff_lat,

            'dropoff_lng' =>
                $transfer->dropoff_lng,

            'pickup_time' =>
                $transfer->pickup_time
                    ?->toISOString(),

            'meet_point' =>
                $transfer->meet_point,

            'adult' =>
                $transfer->adult,

            'child' =>
                $transfer->child,

            'baby' =>
                $transfer->baby,

            'luggage_count' =>
                $transfer->luggage_count,

            'vehicle_type' =>
                $transfer->vehicle_type,

            'status' =>
                $transfer->status,

            'driver' =>
                $transfer->driver
                    ? [
                        'id' =>
                            $transfer->driver->id,

                        'name' =>
                            $transfer->driver->name,

                        'phone' =>
                            $transfer->driver->phone,

                        'vehicle' =>
                            $transfer->driver->vehicle,
                    ]
                    : null,

            'created_at' =>
                $transfer->created_at
                    ?->toISOString(),

            'updated_at' =>
                $transfer->updated_at
                    ?->toISOString(),
        ];

        if ($includeDetails) {
            $data = [
                ...$data,

                'driver_note' =>
                    $transfer->driver_note,

                'passenger_note' =>
                    $transfer->passenger_note,

                'cancellation_reason' =>
                    $transfer->cancellation_reason,

                'cancelled_at' =>
                    $transfer->cancelled_at
                        ?->toISOString(),

                'events' =>
                    $transfer->events,

                'latest_event' =>
                    $transfer->latestEvent,

                'latest_location' =>
                    $transfer->latestLocation,

                'pickup_location' =>
                    $transfer->pickupLocation,

                'pickup_point' =>
                    $transfer->pickupPoint,

                'dropoff_location' =>
                    $transfer->dropoffLocation,

                'dropoff_point' =>
                    $transfer->dropoffPoint,
            ];
        }

        return $data;
    }
}