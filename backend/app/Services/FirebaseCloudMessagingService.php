<?php

namespace App\Services;

use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class FirebaseCloudMessagingService
{
    public function send(string $deviceToken, string $title, string $body, array $data = []): bool
    {
        $projectId = config('firebase.project_id');
        $credentialsPath = config('firebase.credentials');

        if (!$projectId || !$credentialsPath || !is_file($credentialsPath)) {
            throw new RuntimeException('Firebase servis hesabı dosyası yapılandırılmadı.');
        }

        $credentials = new ServiceAccountCredentials(
            ['https://www.googleapis.com/auth/firebase.messaging'],
            $credentialsPath
        );
        $authToken = $credentials->fetchAuthToken();
        $accessToken = $authToken['access_token'] ?? null;
        if (!$accessToken) throw new RuntimeException('Firebase erişim anahtarı alınamadı.');

        $stringData = [];
        foreach ($data as $key => $value) $stringData[$key] = (string) $value;

        $response = Http::withToken($accessToken)
            ->acceptJson()
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $deviceToken,
                    'notification' => ['title' => $title, 'body' => $body],
                    'data' => $stringData,
                    'webpush' => [
                        'fcm_options' => ['link' => rtrim(config('firebase.driver_app_url'), '/')],
                    ],
                ],
            ]);

        return $response->successful();
    }
}
