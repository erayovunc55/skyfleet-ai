<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AgencyAuthController extends Controller
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
            ->with('agencyCompany')
            ->where('role', 'agency')
            ->where(function ($query) use ($login): void {
                $query
                    ->where('email', $login)
                    ->orWhere('phone', $login);
            })
            ->first();

        if (
            !$user
            ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            return response()->json([
                'message' =>
                    'E-posta, telefon veya şifre hatalı.',
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' =>
                    'Bu kullanıcı hesabı aktif değil.',
            ], 403);
        }

        if (!$user->agency_id) {
            return response()->json([
                'message' =>
                    'Acenta hesabı bir şirkete bağlı değil.',
            ], 403);
        }

        if (
            !$user->agencyCompany
            ||
            !$user->agencyCompany->isActive()
        ) {
            return response()->json([
                'message' =>
                    'Acenta şirketi aktif değil.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user
            ->createToken(
                'skyfleet-agency'
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

                'agency_id' =>
                    $user->agency_id,

                'agency_company' => [
                    'id' =>
                        $user->agencyCompany->id,

                    'company_name' =>
                        $user->agencyCompany->company_name,

                    'status' =>
                        $user->agencyCompany->status,

                    'is_active' =>
                        $user->agencyCompany->is_active,

                    'default_currency' =>
                        $user->agencyCompany->default_currency,

                    'discount_percent' =>
                        $user->agencyCompany->discount_percent,
                ],
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