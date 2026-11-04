<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AgencyPasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('role', 'agency')
            ->where('is_active', true)
            ->first();

        if ($user) {
            try {
                $this->sendResetMail($user);
            } catch (\Throwable $exception) {
                Log::warning('Agency password reset email could not be sent.', [
                    'user_id' => $user->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Bu e-posta bir acenta hesabına bağlıysa şifre sıfırlama bağlantısı gönderildi.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $invalid = response()->json([
            'message' => 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
        ], 422);

        $user = User::query()
            ->where('email', $validated['email'])
            ->where('role', 'agency')
            ->first();

        if (!$user) {
            return $invalid;
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
            return $invalid;
        }

        return response()->json([
            'message' => 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        ]);
    }

    private function sendResetMail(User $user): void
    {
        $token = Password::broker()->createToken($user);
        $portalUrl = rtrim(
            (string) config('services.agency_portal.url', 'https://skytriptransfer.com/agency'),
            '/'
        );

        $url = $portalUrl
            .'/?reset_token='.urlencode($token)
            .'&email='.urlencode((string) $user->email);

        \App\Support\SkyMail::raw('agency', 
            "Merhaba {$user->name},\n\nSkyfleet AI acenta portalı şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın.\n\n{$url}\n\nBu bağlantı 60 dakika geçerlidir.\n\nBu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.\n\nHello {$user->name},\nUse the link above to reset your Skyfleet AI agency portal password. It is valid for 60 minutes. If you did not request it, ignore this email.\n\nSkyfleet AI",
            function ($message) use ($user): void {
                $message
                    ->to($user->email, $user->name)
                    ->subject('Skyfleet AI - Şifre Sıfırlama / Password Reset');
            }
        );
    }
}