<?php

namespace App\Mail;

use App\Models\Agency;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AgencyApplicationReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Agency $agency
    ) {
    }

    public function envelope(): Envelope
    {
        [$fromAddress, $fromName] = \App\Support\SkyMail::from('agency');

        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address($fromAddress, $fromName),
            subject: 'Skyfleet Agency Application Received',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.agency-application-received',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}