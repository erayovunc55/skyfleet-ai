<?php

namespace App\Jobs;

use App\Models\Transfer;
use App\Models\TransferImport;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;
use Throwable;

class ImportHeytripTransfersJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 900;

    private const CHUNK_SIZE = 100;

    private const MAX_ROWS = 1000;

    private const MAX_ERRORS = 50;

    private const REQUIRED_HEADERS = [
        'Order Number',
        'Pickup Time',
        'Passenger Phone',
        'Passenger Name',
        'Order Amount',
        'Pickup Address',
        'Drop-off Address',
        'Pickup Address Longitude',
        'Pickup Address Latitude',
        'Destination Longitude',
        'Destination Latitude',
    ];

    public function __construct(
        public int $transferImportId
    ) {
    }

    public function handle(): void
    {
        $import = TransferImport::query()
            ->findOrFail(
                $this->transferImportId
            );

        $import->update([
            'status' =>
                TransferImport::STATUS_PROCESSING,

            'started_at' =>
                now(),

            'completed_at' =>
                null,

            'failed_at' =>
                null,

            'failure_message' =>
                null,
        ]);

        try {
            $this->processImport(
                $import
            );
        } catch (Throwable $exception) {
            report($exception);

            $import->refresh();

            $import->update([
                'status' =>
                    TransferImport::STATUS_FAILED,

                'failed_at' =>
                    now(),

                'failure_message' =>
                    $this->safeFatalMessage(
                        $exception
                    ),
            ]);

            throw $exception;
        }
    }

    private function processImport(
        TransferImport $import
    ): void {
        /*
        |--------------------------------------------------------------------------
        | Excel dosyasını bul
        |--------------------------------------------------------------------------
        |
        | Controller dosyayı local disk üzerinde transfer-imports klasörüne
        | kaydedecek. Job aynı dosyayı buradan okuyacak.
        |
        */

        if (
            !Storage::disk('local')
                ->exists(
                    $import->file_path
                )
        ) {
            throw new RuntimeException(
                'Aktarım için kaydedilen Excel dosyası bulunamadı.'
            );
        }

        $absolutePath =
            Storage::disk('local')
                ->path(
                    $import->file_path
                );

        try {
            $spreadsheet =
                IOFactory::load(
                    $absolutePath
                );
        } catch (Throwable $exception) {
            throw new RuntimeException(
                'Excel dosyası okunamadı.',
                0,
                $exception
            );
        }

        $rows =
            $spreadsheet
                ->getActiveSheet()
                ->toArray(
                    null,
                    true,
                    true,
                    false
                );

        /*
        |--------------------------------------------------------------------------
        | Spreadsheet belleğini serbest bırak
        |--------------------------------------------------------------------------
        */

        $spreadsheet
            ->disconnectWorksheets();

        unset($spreadsheet);

        if (count($rows) < 2) {
            throw new RuntimeException(
                'Excel dosyasında aktarılacak rezervasyon bulunamadı.'
            );
        }

        if (
            count($rows) >
            self::MAX_ROWS + 1
        ) {
            throw new RuntimeException(
                'Tek seferde en fazla '
                . self::MAX_ROWS
                . ' rezervasyon aktarılabilir.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Header kontrolü
        |--------------------------------------------------------------------------
        */

        $headers =
            array_map(
                fn (mixed $header): string =>
                    trim(
                        (string) $header
                    ),
                array_shift($rows)
            );

        $headerIndexes = [];

        foreach (
            $headers as
            $index => $header
        ) {
            if ($header !== '') {
                $headerIndexes[
                    $header
                ] = $index;
            }
        }

        $missingHeaders =
            array_values(
                array_diff(
                    self::REQUIRED_HEADERS,
                    array_keys(
                        $headerIndexes
                    )
                )
            );

        if (
            $missingHeaders !== []
        ) {
            throw new RuntimeException(
                'Excel dosyasındaki zorunlu sütunlardan bazıları eksik: '
                . implode(
                    ', ',
                    $missingHeaders
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Boş satırları temizle
        |--------------------------------------------------------------------------
        |
        | Excel row number bilgisini kaybetmiyoruz.
        |
        */

        $preparedRows = [];

        foreach (
            $rows as
            $rowIndex => $row
        ) {
            if (
                $this->rowIsEmpty(
                    $row
                )
            ) {
                continue;
            }

            $preparedRows[] = [
                'excel_row' =>
                    $rowIndex + 2,

                'row' =>
                    $row,
            ];
        }

        $total =
            count($preparedRows);

        if ($total === 0) {
            throw new RuntimeException(
                'Excel dosyasında aktarılacak rezervasyon bulunamadı.'
            );
        }

        $import->update([
            'total' =>
                $total,

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

        /*
        |--------------------------------------------------------------------------
        | Import counters
        |--------------------------------------------------------------------------
        */

        $processed = 0;
        $imported = 0;
        $skipped = 0;
        $failed = 0;

        $errors = [];

        /*
        |--------------------------------------------------------------------------
        | Dosya içi duplicate koruması
        |--------------------------------------------------------------------------
        |
        | Aynı Excel içinde aynı Order Number iki kez varsa ikinci kayıt
        | tekrar import edilmez.
        |
        */

        $seenReferences = [];

        /*
        |--------------------------------------------------------------------------
        | Chunk processing
        |--------------------------------------------------------------------------
        */

        foreach (
            array_chunk(
                $preparedRows,
                self::CHUNK_SIZE
            )
            as $chunk
        ) {
            /*
            |--------------------------------------------------------------------------
            | Chunk içindeki HeyTrip referanslarını topla
            |--------------------------------------------------------------------------
            */

            $chunkReferences = [];

            foreach (
                $chunk as $item
            ) {
                $reference =
                    $this->text(
                        $this->value(
                            $item['row'],
                            $headerIndexes,
                            'Order Number'
                        )
                    );

                if ($reference !== '') {
                    $chunkReferences[] =
                        $reference;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Tek SQL sorgusu ile mevcut kayıtları bul
            |--------------------------------------------------------------------------
            |
            | Eski sistem her satır için ayrı exists() çalıştırıyordu.
            |
            */

            $existingReferences =
                Transfer::query()
                    ->whereIn(
                        'ota_booking_reference',
                        array_values(
                            array_unique(
                                $chunkReferences
                            )
                        )
                    )
                    ->pluck(
                        'ota_booking_reference'
                    )
                    ->filter()
                    ->map(
                        fn ($value) =>
                            (string) $value
                    )
                    ->flip();

            /*
            |--------------------------------------------------------------------------
            | Chunk tek transaction
            |--------------------------------------------------------------------------
            */

            DB::transaction(
                function () use (
                    $chunk,
                    $headerIndexes,
                    $existingReferences,
                    &$seenReferences,
                    &$processed,
                    &$imported,
                    &$skipped,
                    &$failed,
                    &$errors
                ): void {
                    foreach (
                        $chunk as $item
                    ) {
                        $excelRowNumber =
                            (int) $item[
                                'excel_row'
                            ];

                        $row =
                            $item['row'];

                        $otaBookingReference =
                            $this->text(
                                $this->value(
                                    $row,
                                    $headerIndexes,
                                    'Order Number'
                                )
                            );

                        /*
                        |--------------------------------------------------------------------------
                        | Order Number boş
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $otaBookingReference === ''
                        ) {
                            $failed++;
                            $processed++;

                            $this->appendError(
                                $errors,
                                $excelRowNumber,
                                null,
                                'Order Number alanı boş.'
                            );

                            continue;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | DB duplicate
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $existingReferences
                                ->has(
                                    $otaBookingReference
                                )
                        ) {
                            $skipped++;
                            $processed++;

                            continue;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Aynı Excel dosyası içindeki duplicate
                        |--------------------------------------------------------------------------
                        */

                        if (
                            isset(
                                $seenReferences[
                                    $otaBookingReference
                                ]
                            )
                        ) {
                            $skipped++;
                            $processed++;

                            continue;
                        }

                        $seenReferences[
                            $otaBookingReference
                        ] = true;

                        try {
                            $payload =
                                $this->mapRow(
                                    $row,
                                    $headerIndexes,
                                    $otaBookingReference
                                );

                            Transfer::create(
                                $payload
                            );

                            $imported++;
                        } catch (
                            Throwable $exception
                        ) {
                            report(
                                $exception
                            );

                            $failed++;

                            $this->appendError(
                                $errors,
                                $excelRowNumber,
                                $otaBookingReference,
                                $this->safeRowErrorMessage(
                                    $exception
                                )
                            );
                        }

                        $processed++;
                    }
                }
            );

            /*
            |--------------------------------------------------------------------------
            | Progress güncelle
            |--------------------------------------------------------------------------
            |
            | Frontend GET status endpoint'i üzerinden bu değerleri okuyacak.
            |
            */

            $import->update([
                'processed' =>
                    $processed,

                'imported' =>
                    $imported,

                'skipped' =>
                    $skipped,

                'failed' =>
                    $failed,

                'errors' =>
                    $errors,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Import tamamlandı
        |--------------------------------------------------------------------------
        */

        $import->update([
            'status' =>
                TransferImport::STATUS_COMPLETED,

            'processed' =>
                $processed,

            'imported' =>
                $imported,

            'skipped' =>
                $skipped,

            'failed' =>
                $failed,

            'errors' =>
                $errors,

            'completed_at' =>
                now(),

            'failure_message' =>
                null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Başarılı import dosyasını temizle
        |--------------------------------------------------------------------------
        */

        Storage::disk('local')
            ->delete(
                $import->file_path
            );
    }

    private function mapRow(
        array $row,
        array $headerIndexes,
        string $otaBookingReference
    ): array {
        $pickup =
            $this->requiredText(
                $row,
                $headerIndexes,
                'Pickup Address'
            );

        $dropoff =
            $this->requiredText(
                $row,
                $headerIndexes,
                'Drop-off Address'
            );

        $passengerName =
            $this->requiredText(
                $row,
                $headerIndexes,
                'Passenger Name'
            );

        /*
        |--------------------------------------------------------------------------
        | HeyTrip araç bilgisi
        |--------------------------------------------------------------------------
        |
        | OTA bilgisini değiştirmiyoruz.
        |
        | Örnek:
        |
        | Minibus 8 Seater — Mercedes Vito
        |
        */

        $carType =
            $this->text(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Car Type'
                )
            );

        $vehicle =
            $this->text(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Vehicle'
                )
            );

        $vehicleType =
            implode(
                ' — ',
                array_values(
                    array_filter(
                        [
                            $carType,
                            $vehicle,
                        ],
                        fn (
                            string $value
                        ): bool =>
                            $value !== ''
                    )
                )
            );

        return [
            'booking_reference' =>
                $this->generateBookingReference(),

            'ota_booking_reference' =>
                $otaBookingReference,

            'ota_source' =>
                'HeyTrip',

            'supplier' =>
                'HeyTrip',

            'passenger_name' =>
                $passengerName,

            'passenger_phone' =>
                $this->nullableText(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Passenger Phone'
                    )
                ),

            'passenger_email' =>
                null,

            'flight_number' =>
                $this->nullableText(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Flight Number'
                    )
                ),

            'pickup' =>
                $pickup,

            'pickup_lat' =>
                $this->coordinate(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Pickup Address Latitude'
                    ),
                    -90,
                    90,
                    'Pickup latitude'
                ),

            'pickup_lng' =>
                $this->coordinate(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Pickup Address Longitude'
                    ),
                    -180,
                    180,
                    'Pickup longitude'
                ),

            'dropoff' =>
                $dropoff,

            'dropoff_lat' =>
                $this->coordinate(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Destination Latitude'
                    ),
                    -90,
                    90,
                    'Destination latitude'
                ),

            'dropoff_lng' =>
                $this->coordinate(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Destination Longitude'
                    ),
                    -180,
                    180,
                    'Destination longitude'
                ),

            'pickup_time' =>
                $this->parseDate(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Pickup Time'
                    )
                ),

            'vehicle_type' =>
                $vehicleType !== ''
                    ? $vehicleType
                    : null,

            'adult' =>
                $this->nonNegativeInteger(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Number of Adults'
                    ),
                    0
                ),

            'child' =>
                $this->nonNegativeInteger(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Number of Children'
                    ),
                    0
                ),

            'baby' =>
                0,

            'luggage_count' =>
                $this->nullableInteger(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Number of Luggage'
                    )
                ) ?? 0,

            'price' =>
                $this->number(
                    $this->value(
                        $row,
                        $headerIndexes,
                        'Order Amount'
                    ),
                    'Order Amount'
                ),

            'currency' =>
                'EUR',

            'passenger_note' =>
                $this->buildPassengerNote(
                    $row,
                    $headerIndexes
                ),

            'driver_note' =>
                $this->buildDriverNote(
                    $row,
                    $headerIndexes
                ),

            'driver_id' =>
                null,

            'status' =>
                'pending',
        ];
    }

    private function buildPassengerNote(
        array $row,
        array $headerIndexes
    ): ?string {
        $parts = [];

        $remarks =
            $this->nullableText(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Passnger Remarks'
                )
            );

        if (
            $remarks !== null
        ) {
            $parts[] =
                $remarks;
        }

        if (
            $this->boolean(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Meet Greet'
                )
            )
        ) {
            $parts[] =
                'Meet & Greet istendi.';
        }

        if (
            $this->boolean(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Child Seat'
                )
            )
        ) {
            $parts[] =
                'Çocuk koltuğu istendi.';
        }

        return $parts !== []
            ? implode(
                PHP_EOL,
                $parts
            )
            : null;
    }

    private function buildDriverNote(
        array $row,
        array $headerIndexes
    ): ?string {
        $driverName =
            $this->nullableText(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Driver Name'
                )
            );

        $driverPhone =
            $this->nullableText(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Driver Phone'
                )
            );

        if (
            $driverName === null
            &&
            $driverPhone === null
        ) {
            return null;
        }

        return sprintf(
            'HeyTrip önceki sürücü kaydı: %s%s',
            $driverName ?? 'İsim yok',
            $driverPhone !== null
                ? ' / ' . $driverPhone
                : ''
        );
    }

    private function parseDate(
        mixed $value
    ): Carbon {
        /*
        |--------------------------------------------------------------------------
        | HeyTrip Excel timezone
        |--------------------------------------------------------------------------
        */

        $importTimezone =
            'Europe/Istanbul';

        if (
            $value instanceof
            DateTimeInterface
        ) {
            return Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $value->format(
                    'Y-m-d H:i:s'
                ),
                $importTimezone
            )->utc();
        }

        if (
            is_numeric($value)
        ) {
            $excelDate =
                ExcelDate::excelToDateTimeObject(
                    (float) $value
                );

            return Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $excelDate->format(
                    'Y-m-d H:i:s'
                ),
                $importTimezone
            )->utc();
        }

        $text =
            trim(
                (string) $value
            );

        if ($text === '') {
            throw new RuntimeException(
                'Pickup Time alanı boş.'
            );
        }

        foreach (
            [
                'n/j/Y g:i:s A',
                'n/j/Y g:i A',
                'm/d/Y h:i:s A',
                'm/d/Y h:i A',
            ]
            as $format
        ) {
            try {
                return Carbon::createFromFormat(
                    $format,
                    $text,
                    $importTimezone
                )->utc();
            } catch (
                Throwable
            ) {
                // Bir sonraki format.
            }
        }

        throw new RuntimeException(
            'Pickup Time biçimi tanınmadı.'
        );
    }

    private function value(
        array $row,
        array $headerIndexes,
        string $header
    ): mixed {
        if (
            !array_key_exists(
                $header,
                $headerIndexes
            )
        ) {
            return null;
        }

        return
            $row[
                $headerIndexes[
                    $header
                ]
            ]
            ?? null;
    }

    private function requiredText(
        array $row,
        array $headerIndexes,
        string $header
    ): string {
        $value =
            $this->text(
                $this->value(
                    $row,
                    $headerIndexes,
                    $header
                )
            );

        if ($value === '') {
            throw new RuntimeException(
                $header
                . ' alanı boş.'
            );
        }

        return $value;
    }

    private function text(
        mixed $value
    ): string {
        if ($value === null) {
            return '';
        }

        if (
            is_float($value)
            &&
            floor($value) ===
                $value
        ) {
            return number_format(
                $value,
                0,
                '.',
                ''
            );
        }

        return trim(
            (string) $value
        );
    }

    private function nullableText(
        mixed $value
    ): ?string {
        $text =
            $this->text(
                $value
            );

        return $text !== ''
            ? $text
            : null;
    }

    private function number(
        mixed $value,
        string $label
    ): float {
        if (
            !is_numeric($value)
        ) {
            throw new RuntimeException(
                $label
                . ' sayısal değil.'
            );
        }

        return (float) $value;
    }

    private function coordinate(
        mixed $value,
        float $minimum,
        float $maximum,
        string $label
    ): float {
        $number =
            $this->number(
                $value,
                $label
            );

        if (
            $number < $minimum
            ||
            $number > $maximum
        ) {
            throw new RuntimeException(
                $label
                . ' geçerli aralığın dışında.'
            );
        }

        return $number;
    }

    private function nonNegativeInteger(
        mixed $value,
        int $default
    ): int {
        if (
            $value === null
            ||
            $value === ''
        ) {
            return $default;
        }

        if (
            !is_numeric($value)
            ||
            (int) $value < 0
        ) {
            return $default;
        }

        return (int) $value;
    }

    private function nullableInteger(
        mixed $value
    ): ?int {
        if (
            $value === null
            ||
            $value === ''
        ) {
            return null;
        }

        if (
            !is_numeric($value)
            ||
            (int) $value < 0
        ) {
            return null;
        }

        return (int) $value;
    }

    private function boolean(
        mixed $value
    ): bool {
        if (
            is_bool($value)
        ) {
            return $value;
        }

        return in_array(
            strtolower(
                trim(
                    (string) $value
                )
            ),
            [
                '1',
                'true',
                'yes',
                'evet',
            ],
            true
        );
    }

    private function rowIsEmpty(
        array $row
    ): bool {
        foreach (
            $row as $value
        ) {
            if (
                $value !== null
                &&
                trim(
                    (string) $value
                ) !== ''
            ) {
                return false;
            }
        }

        return true;
    }

    private function generateBookingReference(): string
    {
        $year =
            now()->format('Y');

        do {
            $reference =
                sprintf(
                    'SF-%s-%05d',
                    $year,
                    random_int(
                        1,
                        99999
                    )
                );
        } while (
            Transfer::query()
                ->where(
                    'booking_reference',
                    $reference
                )
                ->exists()
        );

        return $reference;
    }

    private function appendError(
        array &$errors,
        int $row,
        ?string $otaBookingReference,
        string $message
    ): void {
        if (
            count($errors) >=
            self::MAX_ERRORS
        ) {
            return;
        }

        $errors[] = [
            'row' =>
                $row,

            'ota_booking_reference' =>
                $otaBookingReference,

            'message' =>
                $message,
        ];
    }

    private function safeRowErrorMessage(
        Throwable $exception
    ): string {
        if (
            $exception instanceof
            RuntimeException
        ) {
            return
                $exception->getMessage();
        }

        return
            'Satır kaydedilemedi.';
    }

    private function safeFatalMessage(
        Throwable $exception
    ): string {
        if (
            $exception instanceof
            RuntimeException
        ) {
            return
                $exception->getMessage();
        }

        return
            'Excel aktarımı tamamlanamadı.';
    }

    public function failed(
        ?Throwable $exception
    ): void {
        $import =
            TransferImport::query()
                ->find(
                    $this->transferImportId
                );

        if (!$import) {
            return;
        }

        if (
            $import->status ===
            TransferImport::STATUS_COMPLETED
        ) {
            return;
        }

        $import->update([
            'status' =>
                TransferImport::STATUS_FAILED,

            'failed_at' =>
                now(),

            'failure_message' =>
                $exception
                    ? $this->safeFatalMessage(
                        $exception
                    )
                    : 'Excel aktarımı başarısız oldu.',
        ]);
    }
}