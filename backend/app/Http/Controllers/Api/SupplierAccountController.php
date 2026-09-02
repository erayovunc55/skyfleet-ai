<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupplierAccountController extends Controller
{
    public function store(
        Request $request
    ): JsonResponse {
        $validated =
            $request->validate([
                /*
                 * Şirket bilgileri
                 */
                'company_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'legal_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'contact_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'company_email' => [
                    'required',
                    'email',
                    'max:255',

                    Rule::unique(
                        'suppliers',
                        'email'
                    ),
                ],

                'company_phone' => [
                    'required',
                    'string',
                    'max:50',
                ],

                'whatsapp' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'tax_number' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'registration_number' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'country_code' => [
                    'required',
                    'string',
                    'size:2',
                ],

                'country_name' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'city' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'address' => [
                    'nullable',
                    'string',
                    'max:5000',
                ],

                'timezone' => [
                    'required',
                    'timezone',
                ],

                'default_currency' => [
                    'required',
                    'string',
                    'size:3',
                ],

                'payout_percentage' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:100',
                ],

                /*
                 * Portal kullanıcısı
                 */
                'portal_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'portal_email' => [
                    'required',
                    'email',
                    'max:255',

                    Rule::unique(
                        'users',
                        'email'
                    ),
                ],

                'portal_phone' => [
                    'required',
                    'string',
                    'max:50',

                    Rule::unique(
                        'users',
                        'phone'
                    ),
                ],

                'portal_password' => [
                    'required',
                    'string',
                    'min:8',
                    'max:255',
                    'confirmed',
                ],
            ]);

        $actor =
            $request->user();

        $result = DB::transaction(
            function () use (
                $validated,
                $actor
            ): array {
                $supplier =
                    Supplier::create([
                        'company_name' =>
                            trim(
                                $validated[
                                    'company_name'
                                ]
                            ),

                        'legal_name' =>
                            $this->nullableString(
                                $validated[
                                    'legal_name'
                                ] ?? null
                            ),

                        'slug' =>
                            $this->makeUniqueSlug(
                                $validated[
                                    'company_name'
                                ]
                            ),

                        'contact_name' =>
                            trim(
                                $validated[
                                    'contact_name'
                                ]
                            ),

                        'email' =>
                            mb_strtolower(
                                trim(
                                    $validated[
                                        'company_email'
                                    ]
                                )
                            ),

                        'phone' =>
                            trim(
                                $validated[
                                    'company_phone'
                                ]
                            ),

                        'whatsapp' =>
                            $this->nullableString(
                                $validated[
                                    'whatsapp'
                                ] ?? null
                            ),

                        'tax_number' =>
                            $this->nullableString(
                                $validated[
                                    'tax_number'
                                ] ?? null
                            ),

                        'registration_number' =>
                            $this->nullableString(
                                $validated[
                                    'registration_number'
                                ] ?? null
                            ),

                        'country_code' =>
                            mb_strtoupper(
                                trim(
                                    $validated[
                                        'country_code'
                                    ]
                                )
                            ),

                        'country_name' =>
                            $this->nullableString(
                                $validated[
                                    'country_name'
                                ] ?? null
                            ),

                        'city' =>
                            trim(
                                $validated[
                                    'city'
                                ]
                            ),

                        'address' =>
                            $this->nullableString(
                                $validated[
                                    'address'
                                ] ?? null
                            ),

                        'timezone' =>
                            $validated[
                                'timezone'
                            ],

                        'default_currency' =>
                            mb_strtoupper(
                                trim(
                                    $validated[
                                        'default_currency'
                                    ]
                                )
                            ),

                        'payout_percentage' =>
                            round(
                                (float)
                                $validated[
                                    'payout_percentage'
                                ],
                                2
                            ),

                        'locale' =>
                            'tr',

                        'status' =>
                            Supplier::STATUS_APPROVED,

                        'submitted_at' =>
                            now(),

                        'approved_at' =>
                            now(),

                        'approved_by' =>
                            $actor?->id,

                        'is_active' =>
                            true,
                    ]);

                $portalUser =
                    User::create([
                        'supplier_id' =>
                            $supplier->id,

                        'name' =>
                            trim(
                                $validated[
                                    'portal_name'
                                ]
                            ),

                        'email' =>
                            mb_strtolower(
                                trim(
                                    $validated[
                                        'portal_email'
                                    ]
                                )
                            ),

                        'phone' =>
                            trim(
                                $validated[
                                    'portal_phone'
                                ]
                            ),

                        'password' =>
                            Hash::make(
                                $validated[
                                    'portal_password'
                                ]
                            ),

                        'role' =>
                            'supplier',

                        'is_active' =>
                            true,
                    ]);

                return [
                    'supplier' =>
                        $supplier,

                    'portal_user' =>
                        $portalUser,
                ];
            }
        );

        return response()->json([
            'message' =>
                'Tedarikçi ve portal hesabı başarıyla oluşturuldu.',

            'data' => [
                'supplier' =>
                    $result[
                        'supplier'
                    ],

                'portal_user' =>
                    $result[
                        'portal_user'
                    ]->only([
                        'id',
                        'supplier_id',
                        'name',
                        'email',
                        'phone',
                        'role',
                        'is_active',
                    ]),
            ],
        ], 201);
    }

    private function nullableString(
        mixed $value
    ): ?string {
        $resolved =
            trim(
                (string) $value
            );

        return $resolved !== ''
            ? $resolved
            : null;
    }

    private function makeUniqueSlug(
        string $companyName
    ): string {
        $base =
            Str::slug(
                $companyName
            ) ?: 'supplier';

        $slug = $base;
        $counter = 2;

        while (
            Supplier::withTrashed()
                ->where(
                    'slug',
                    $slug
                )
                ->exists()
        ) {
            $slug =
                $base .
                '-' .
                $counter;

            $counter++;
        }

        return $slug;
    }
}