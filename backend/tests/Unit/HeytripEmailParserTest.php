<?php

namespace Tests\Unit;

use App\Services\HeytripEmailParser;
use PHPUnit\Framework\TestCase;

class HeytripEmailParserTest extends TestCase
{
    public function test_it_parses_a_new_booking_with_a_line_break_before_the_pickup_timestamp(): void
    {
        $body = <<<'MAIL'
ORDER INFO
HeyTrip Confirmation Number HT102920103589110102205
ITINERARY
Pickup From Istanbul Aiport Sabiha Gökçen (SAW), Türkiye([40.905371,29.3168603](https://maps.example))
Pick up time (local time)
Thursday, October 29, 2026 8:10:00 PM (2026-10-29 20:10:00)
Dropoff At The Galata Glory Hotel, İstanbul([41.024959,28.974854](https://maps.example))
Flight number PC288
SUPPLIER VEHICLE TYPE
Name SUV
Seats 4
Luggage 4
PASSENGER INFORMATION
Name Francesco Cannizzaro
Number of Passengers Adult:4 Child:0
Phone Number `+393715142683`
Email carcssupport@cs.heytripgo.com
PRICE
Settlement Amount Total EUR 63.0000
MAIL;

        $result = (new HeytripEmailParser())->parse(
            'HeyTrip booking confirmation No:(HT102920103589110102205)',
            $body
        );

        $this->assertSame('new', $result['type']);
        $this->assertSame('HT102920103589110102205', $result['ota_booking_reference']);
        $this->assertSame('Francesco Cannizzaro', $result['passenger_name']);
        $this->assertSame('+393715142683', $result['passenger_phone']);
        $this->assertSame('2026-10-29 17:10:00', $result['pickup_time']->format('Y-m-d H:i:s'));
        $this->assertSame(40.905371, $result['pickup_lat']);
        $this->assertSame(63.0, $result['price']);
    }

    public function test_it_parses_modification_emails_with_non_ht_references(): void
    {
        $body = <<<'MAIL'
MODIFICATION REQUEST
Order modification request AT092817353DD7208030120
HeyTrip Confirmation Number AT092817353DD7208030120
NEW ITINERARY
Pick up time (local time)
Monday, October 19, 2026 12:55:00 PM (2026-10-19 12:55:00)
NEW SUPPLIER VEHICLE TYPE
Name Comfort 5 Seats
NEW PASSENGER INFORMATION
Name German Iashchenko
NEW PRICE
Settlement Amount Total EUR 45.0000
MAIL;

        $result = (new HeytripEmailParser())->parse(
            'Booking from HeyTrip - Order modification to be confirmed No:(AT092817353DD7208030120)',
            $body
        );

        $this->assertSame('update', $result['type']);
        $this->assertSame('AT092817353DD7208030120', $result['ota_booking_reference']);
        $this->assertSame('2026-10-19 09:55:00', $result['pickup_time']->format('Y-m-d H:i:s'));
        $this->assertSame('Comfort 5 Seats', $result['vehicle_type']);
    }

    public function test_it_identifies_cancellations_with_compact_labels(): void
    {
        $body = <<<'MAIL'
CANCELLED Order Cancellation Notice
HeyTrip Confirmation NumberHT102212159322110102025
ITINERARY
Pick up time(local time)2026年10月22日 12:15:00(2026-10-22 12:15:00)
Pickup From Istanbul Airport([40.905371,29.3168603](https://maps.example))
Dropoff At Ferman Hilal Hotel([41.04103,28.98516](https://maps.example))
SUPPLIER VEHICLE TYPE
Name Comfort 8 Seats
Luggage6
MAIL;

        $result = (new HeytripEmailParser())->parse(
            'HeyTrip cancellation of your booking(HT102212159322110102025)',
            $body
        );

        $this->assertSame('cancelled', $result['type']);
        $this->assertSame('HT102212159322110102025', $result['ota_booking_reference']);
        $this->assertArrayNotHasKey('pickup_time', $result);
    }
}
