<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class TransferExcelImportController extends Controller
{
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

        try {
            $spreadsheet = IOFactory::load(
                $validated['file']->getRealPath()
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' =>
                    'Excel dosyası okunamadı. Dosyanın geçerli bir XLS veya XLSX dosyası olduğunu kontrol edin.',
            ], 422);
        }

        $rows = $spreadsheet
            ->getActiveSheet()
            ->toArray(null, true, true, false);

        if (count($rows) < 2) {
            return response()->json([
                'message' =>
                    'Excel dosyasında aktarılacak rezervasyon bulunamadı.',
            ], 422);
        }

        if (count($rows) > 1001) {
            return response()->json([
                'message' =>
                    'Tek seferde en fazla 1000 rezervasyon aktarılabilir.',
            ], 422);
        }

        $headers = array_map(
            fn (mixed $header): string =>
                trim((string) $header),
            array_shift($rows)
        );

        $headerIndexes = [];

        foreach ($headers as $index => $header) {
            if ($header !== '') {
                $headerIndexes[$header] = $index;
            }
        }

        $missingHeaders = array_values(
            array_diff(
                self::REQUIRED_HEADERS,
                array_keys($headerIndexes)
            )
        );

        if ($missingHeaders !== []) {
            return response()->json([
                'message' =>
                    'Excel dosyasındaki zorunlu sütunlardan bazıları eksik.',
                'missing_headers' => $missingHeaders,
            ], 422);
        }

        $summary = [
            'total' => 0,
            'imported' => 0,
            'skipped' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($rows as $rowIndex => $row) {
            $excelRowNumber = $rowIndex + 2;

            if ($this->rowIsEmpty($row)) {
                continue;
            }

            $summary['total']++;

            $otaBookingReference = $this->text(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Order Number'
                )
            );

            if ($otaBookingReference === '') {
                $this->addError(
                    $summary,
                    $excelRowNumber,
                    null,
                    'Order Number alanı boş.'
                );

                continue;
            }

            if (
                Transfer::query()
                    ->where(
                        'ota_booking_reference',
                        $otaBookingReference
                    )
                    ->exists()
            ) {
                $summary['skipped']++;

                continue;
            }

            try {
                $payload = $this->mapRow(
                    $row,
                    $headerIndexes,
                    $otaBookingReference
                );

                DB::transaction(
                    fn () => Transfer::create($payload)
                );

                $summary['imported']++;
            } catch (Throwable $exception) {
                report($exception);

                $this->addError(
                    $summary,
                    $excelRowNumber,
                    $otaBookingReference,
                    $this->safeErrorMessage($exception)
                );
            }
        }

        return response()->json([
            'message' => sprintf(
                '%d rezervasyon aktarıldı, %d yinelenen kayıt atlandı, %d satır başarısız oldu.',
                $summary['imported'],
                $summary['skipped'],
                $summary['failed']
            ),
            'data' => $summary,
        ]);
    }

    private function mapRow(
        array $row,
        array $headerIndexes,
        string $otaBookingReference
    ): array {
        $pickup = $this->requiredText(
            $row,
            $headerIndexes,
            'Pickup Address'
        );

        $dropoff = $this->requiredText(
            $row,
            $headerIndexes,
            'Drop-off Address'
        );

        $passengerName = $this->requiredText(
            $row,
            $headerIndexes,
            'Passenger Name'
        );

        $carType = $this->text(
            $this->value(
                $row,
                $headerIndexes,
                'Car Type'
            )
        );

        $vehicle = $this->text(
            $this->value(
                $row,
                $headerIndexes,
                'Vehicle'
            )
        );

        $vehicleType = implode(
            ' — ',
            array_values(
                array_filter(
                    [$carType, $vehicle],
                    fn (string $value): bool =>
                        $value !== ''
                )
            )
        );

        return [
            'booking_reference' =>
                $this->generateBookingReference(),
            'ota_booking_reference' =>
                $otaBookingReference,
            'ota_source' => 'HeyTrip',
            'supplier' => 'HeyTrip',
            'passenger_name' => $passengerName,
            'passenger_phone' => $this->nullableText(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Passenger Phone'
                )
            ),
            'passenger_email' => null,
            'flight_number' => $this->nullableText(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Flight Number'
                )
            ),
            'pickup' => $pickup,
            'pickup_lat' => $this->coordinate(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Pickup Address Latitude'
                ),
                -90,
                90,
                'Pickup latitude'
            ),
            'pickup_lng' => $this->coordinate(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Pickup Address Longitude'
                ),
                -180,
                180,
                'Pickup longitude'
            ),
            'dropoff' => $dropoff,
            'dropoff_lat' => $this->coordinate(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Destination Latitude'
                ),
                -90,
                90,
                'Destination latitude'
            ),
            'dropoff_lng' => $this->coordinate(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Destination Longitude'
                ),
                -180,
                180,
                'Destination longitude'
            ),
            'pickup_time' => $this->parseDate(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Pickup Time'
                )
            ),
            'vehicle_type' =>
                $vehicleType !== '' ? $vehicleType : null,
            'adult' => $this->nonNegativeInteger(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Number of Adults'
                ),
                0
            ),
            'child' => $this->nonNegativeInteger(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Number of Children'
                ),
                0
            ),
            'baby' => 0,
            'luggage_count' => $this->nullableInteger(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Number of Luggage'
                )
            ) ?? 0,
            'price' => $this->number(
                $this->value(
                    $row,
                    $headerIndexes,
                    'Order Amount'
                ),
                'Order Amount'
            ),
            'currency' => 'EUR',
            'passenger_note' => $this->buildPassengerNote(
                $row,
                $headerIndexes
            ),
            'driver_note' => $this->buildDriverNote(
                $row,
                $headerIndexes
            ),
            'driver_id' => null,
            'status' => 'pending',
        ];
    }

    private function buildPassengerNote(
        array $row,
        array $headerIndexes
    ): ?string {
        $parts = [];

        $remarks = $this->nullableText(
            $this->value(
                $row,
                $headerIndexes,
                'Passnger Remarks'
            )
        );

        if ($remarks !== null) {
            $parts[] = $remarks;
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
            $parts[] = 'Meet & Greet istendi.';
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
            $parts[] = 'Çocuk koltuğu istendi.';
        }

        return $parts !== []
            ? implode(PHP_EOL, $parts)
            : null;
    }

    private function buildDriverNote(
        array $row,
        array $headerIndexes
    ): ?string {
        $driverName = $this->nullableText(
            $this->value(
                $row,
                $headerIndexes,
                'Driver Name'
            )
        );

        $driverPhone = $this->nullableText(
            $this->value(
                $row,
                $headerIndexes,
                'Driver Phone'
            )
        );

        if ($driverName === null && $driverPhone === null) {
            return null;
        }

        return sprintf(
            'HeyTrip önceki sürücü kaydı: %s%s',
            $driverName ?? 'İsim yok',
            $driverPhone !== null
                ? ' / '.$driverPhone
                : ''
        );
    }

    private function parseDate(mixed $value): Carbon
    {
        $importTimezone = 'Europe/Istanbul';

        if ($value instanceof DateTimeInterface) {
            return Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $value->format('Y-m-d H:i:s'),
                $importTimezone
            )->utc();
        }

        if (is_numeric($value)) {
            $excelDate = ExcelDate::excelToDateTimeObject(
                (float) $value
            );

            return Carbon::createFromFormat(
                'Y-m-d H:i:s',
                $excelDate->format('Y-m-d H:i:s'),
                $importTimezone
            )->utc();
        }

        $text = trim((string) $value);

        if ($text === '') {
            throw new \RuntimeException(
                'Pickup Time alanı boş.'
            );
        }

        foreach (
            [
                'n/j/Y g:i:s A',
                'n/j/Y g:i A',
                'm/d/Y h:i:s A',
                'm/d/Y h:i A',
            ] as $format
        ) {
            try {
                return Carbon::createFromFormat(
                    $format,
                    $text,
                    $importTimezone
                )->utc();
            } catch (Throwable) {
                // Bir sonraki biçimi dene.
            }
        }

        throw new \RuntimeException(
            'Pickup Time biçimi tanınmadı.'
        );
    }

    private function value(
        array $row,
        array $headerIndexes,
        string $header
    ): mixed {
        if (!array_key_exists($header, $headerIndexes)) {
            return null;
        }

        return $row[$headerIndexes[$header]] ?? null;
    }

    private function requiredText(
        array $row,
        array $headerIndexes,
        string $header
    ): string {
        $value = $this->text(
            $this->value(
                $row,
                $headerIndexes,
                $header
            )
        );

        if ($value === '') {
            throw new \RuntimeException(
                $header.' alanı boş.'
            );
        }

        return $value;
    }

    private function text(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_float($value) && floor($value) === $value) {
            return number_format($value, 0, '.', '');
        }

        return trim((string) $value);
    }

    private function nullableText(mixed $value): ?string
    {
        $text = $this->text($value);

        return $text !== '' ? $text : null;
    }

    private function number(
        mixed $value,
        string $label
    ): float {
        if (!is_numeric($value)) {
            throw new \RuntimeException(
                $label.' sayısal değil.'
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
        $number = $this->number($value, $label);

        if ($number < $minimum || $number > $maximum) {
            throw new \RuntimeException(
                $label.' geçerli aralığın dışında.'
            );
        }

        return $number;
    }

    private function nonNegativeInteger(
        mixed $value,
        int $default
    ): int {
        if ($value === null || $value === '') {
            return $default;
        }

        if (!is_numeric($value) || (int) $value < 0) {
            return $default;
        }

        return (int) $value;
    }

    private function nullableInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value) || (int) $value < 0) {
            return null;
        }

        return (int) $value;
    }

    private function boolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(
            strtolower(trim((string) $value)),
            ['1', 'true', 'yes', 'evet'],
            true
        );
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if ($value !== null && trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function generateBookingReference(): string
    {
        $year = now()->format('Y');

        do {
            $reference = sprintf(
                'SF-%s-%05d',
                $year,
                random_int(1, 99999)
            );
        } while (
            Transfer::query()
                ->where('booking_reference', $reference)
                ->exists()
        );

        return $reference;
    }

    private function addError(
        array &$summary,
        int $row,
        ?string $otaBookingReference,
        string $message
    ): void {
        $summary['failed']++;

        if (count($summary['errors']) >= 50) {
            return;
        }

        $summary['errors'][] = [
            'row' => $row,
            'ota_booking_reference' => $otaBookingReference,
            'message' => $message,
        ];
    }

    private function safeErrorMessage(Throwable $exception): string
    {
        if ($exception instanceof \RuntimeException) {
            return $exception->getMessage();
        }

        return 'Satır kaydedilemedi.';
    }
}
