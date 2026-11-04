<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PassengerTrackingLinkMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $passengerName,
        public string $bookingReference,
        public string $trackingUrl
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf(
                'Your driver is on the way - %s',
                $this->bookingReference
            )
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown:
                'mail.passenger-tracking-link',
            with: [
                'passengerName' =>
                    $this->passengerName,
                'bookingReference' =>
                    $this->bookingReference,
                'trackingUrl' =>
                    $this->trackingUrl,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}