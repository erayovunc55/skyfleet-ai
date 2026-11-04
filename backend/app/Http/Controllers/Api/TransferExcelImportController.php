<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ImportHeytripTransfersJob;
use App\Models\TransferImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class TransferExcelImportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xls,xlsx',
                'max:10240',
            ],
        ]);

        $file = $validated['file'];

        $extension =
            strtolower(
                $file->getClientOriginalExtension()
            );

        $safeExtension =
            in_array(
                $extension,
                ['xls', 'xlsx'],
                true
            )
                ? $extension
                : 'xlsx';

        $storedFilename =
            sprintf(
                '%s-%s.%s',
                now()->format('Ymd-His'),
                Str::uuid(),
                $safeExtension
            );

        try {
            $filePath =
                $file->storeAs(
                    'transfer-imports',
                    $storedFilename,
                    'local'
                );

            if (!$filePath) {
                return response()->json([
                    'message' =>
                        'Excel dosyası geçici depolama alanına kaydedilemedi.',
                ], 500);
            }

            $import =
                TransferImport::query()
                    ->create([
                        'user_id' =>
                            $request->user()?->id,

                        'source' =>
                            'heytrip_excel',

                        'original_filename' =>
                            $file->getClientOriginalName(),

                        'file_path' =>
                            $filePath,

                        'status' =>
                            TransferImport::STATUS_QUEUED,

                        'total' =>
                            0,

                        'processed' =>
                            0,

                        'imported' =>
                            0,

                        'skipped' =>
                            0,

                        'failed' =>
                            0,

                        'errors' =>
                            [],
                    ]);

            ImportHeytripTransfersJob::dispatch(
                $import->id
            );

            return response()->json([
                'message' =>
                    'Excel aktarımı başlatıldı.',

                'data' => [
                    'id' =>
                        $import->id,

                    'status' =>
                        $import->status,

                    'total' =>
                        $import->total,

                    'processed' =>
                        $import->processed,

                    'imported' =>
                        $import->imported,

                    'skipped' =>
                        $import->skipped,

                    'failed' =>
                        $import->failed,

                    'progress_percentage' =>
                        $import->progressPercentage(),

                    'errors' =>
                        $import->errors ?? [],
                ],
            ], 202);
        } catch (Throwable $exception) {
            report($exception);

            if (
                isset($filePath)
                &&
                $filePath
                &&
                Storage::disk('local')
                    ->exists($filePath)
            ) {
                Storage::disk('local')
                    ->delete($filePath);
            }

            return response()->json([
                'message' =>
                    'Excel aktarımı başlatılamadı.',
            ], 500);
        }
    }

    public function show(
        Request $request,
        TransferImport $transferImport
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | Güvenlik
        |--------------------------------------------------------------------------
        |
        | Import başka bir kullanıcıya aitse göstermiyoruz.
        | Admin / dispatcher yapısında aynı kullanıcı kendi başlattığı
        | import sürecini takip eder.
        |
        */

        $userId =
            $request->user()?->id;

        if (
            $transferImport->user_id !== null
            &&
            $userId !== null
            &&
            (int) $transferImport->user_id !==
                (int) $userId
        ) {
            abort(404);
        }

        $transferImport->refresh();

        return response()->json([
            'data' => [
                'id' =>
                    $transferImport->id,

                'source' =>
                    $transferImport->source,

                'original_filename' =>
                    $transferImport->original_filename,

                'status' =>
                    $transferImport->status,

                'total' =>
                    $transferImport->total,

                'processed' =>
                    $transferImport->processed,

                'imported' =>
                    $transferImport->imported,

                'skipped' =>
                    $transferImport->skipped,

                'failed' =>
                    $transferImport->failed,

                'progress_percentage' =>
                    $transferImport
                        ->progressPercentage(),

                'errors' =>
                    $transferImport->errors
                    ?? [],

                'failure_message' =>
                    $transferImport->failure_message,

                'started_at' =>
                    $transferImport->started_at,

                'completed_at' =>
                    $transferImport->completed_at,

                'failed_at' =>
                    $transferImport->failed_at,

                'created_at' =>
                    $transferImport->created_at,
            ],
        ]);
    }
}