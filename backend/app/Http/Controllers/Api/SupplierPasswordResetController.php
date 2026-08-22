<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class SupplierPasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('role', 'supplier')
            ->whereNotNull('supplier_id')
            ->first();

        if ($user) {
            $this->sendResetMail($user);
        }

        return response()->json([
            'message' => 'Bu e-posta bir tedarikçi hesabına bağlıysa şifre sıfırlama bağlantısı gönderildi.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('role', 'supplier')
            ->whereNotNull('supplier_id')
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
            ], 422);
        }

        $status = Password::broker()->reset(
            $validated,
            function (User $resetUser, string $password): void {
                $resetUser->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $resetUser->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
            ], 422);
        }

        return response()->json([
            'message' => 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        ]);
    }

    public function adminSend(Supplier $supplier): JsonResponse
    {
        $user = User::query()
            ->where('supplier_id', $supplier->id)
            ->where('role', 'supplier')
            ->whereNotNull('email')
            ->orderBy('id')
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Bu tedarikçiye bağlı e-posta adresi olan portal hesabı bulunamadı.',
            ], 422);
        }

        $this->sendResetMail($user);

        return response()->json([
            'message' => 'Şifre sıfırlama bağlantısı '.$user->email.' adresine gönderildi.',
            'email' => $user->email,
        ]);
    }

    private function sendResetMail(User $user): void
    {
        $token = Password::broker()->createToken($user);
        $portalUrl = rtrim(
            (string) config('services.supplier_portal.url', 'https://skytriptransfer.com/supplier'),
            '/'
        );

        $url = $portalUrl
            .'/?reset_token='.urlencode($token)
            .'&email='.urlencode((string) $user->email);

        Mail::raw(
            "Merhaba {$user->name},\n\nSkyfleet AI tedarikçi portalı şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın.\n\n{$url}\n\nBu bağlantı 60 dakika geçerlidir ve yalnızca şifre sıfırlama amacıyla kullanılmalıdır.\n\nBu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.\n\nSkyfleet AI",
            function ($message) use ($user): void {
                $message
                    ->to($user->email, $user->name)
                    ->subject('Skyfleet AI - Şifre Sıfırlama');
            }
        );
    }
}
