<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'login' => [
                'required',
                'string',
                'max:255',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $login = trim(
            $validated['login']
        );

        $user = User::query()
            ->with([
                'supplierCompany',
            ])
            ->where(
                function ($query) use (
                    $login
                ): void {
                    $query
                        ->where(
                            'email',
                            $login
                        )
                        ->orWhere(
                            'phone',
                            $login
                        );
                }
            )
            ->first();

        if (
            !$user
            || !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            return response()->json([
                'message' =>
                    'Telefon, e-posta veya şifre hatalı.',
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' =>
                    'Bu kullanıcı hesabı aktif değil.',
            ], 403);
        }

        if (
            $user->role === 'supplier'
            && !$user->supplier_id
        ) {
            return response()->json([
                'message' =>
                    'Tedarikçi hesabı bir şirkete bağlı değil.',
            ], 403);
        }

        if (
            $user->role === 'supplier'
            && (
                !$user->supplierCompany
                || !$user
                    ->supplierCompany
                    ->canOperate()
            )
        ) {
            return response()->json([
                'message' =>
                    'Tedarikçi şirketi operasyon kullanımına açık değil.',
            ], 403);
        }

        /*
         * Aynı kullanıcı için daha önce
         * oluşturulan giriş tokenları
         * temizlenir.
         */
        $user->tokens()->delete();

        $token = $user
            ->createToken(
                'skyfleet-api'
            )
            ->plainTextToken;

        return response()->json([
            'message' =>
                'Giriş başarılı.',

            'token' =>
                $token,

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

                'is_active' =>
                    $user->is_active,

                'vehicle_id' =>
                    $user->vehicle_id,

                'vehicle_plate' =>
                    $user->vehicle_plate,

                /*
                 * Eski metin alanı.
                 */
                'supplier' =>
                    $user->supplier,

                /*
                 * Güvenli tedarikçi
                 * şirket bağlantısı.
                 */
                'supplier_id' =>
                    $user->supplier_id,

                'supplier_company' =>
                    $user->supplierCompany
                        ? [
                            'id' =>
                                $user
                                    ->supplierCompany
                                    ->id,

                            'company_name' =>
                                $user
                                    ->supplierCompany
                                    ->company_name,

                            'status' =>
                                $user
                                    ->supplierCompany
                                    ->status,

                            'is_active' =>
                                $user
                                    ->supplierCompany
                                    ->is_active,

                            'default_currency' =>
                                $user
                                    ->supplierCompany
                                    ->default_currency,
                        ]
                        : null,
            ],
        ]);
    }

    public function logout(
        Request $request
    ): JsonResponse {
        $request
            ->user()
            ?->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' =>
                'Çıkış yapıldı.',
        ]);
    }
}