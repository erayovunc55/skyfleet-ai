<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

/**
 * Sends mail through the Resend HTTPS API (no SMTP ports and no extra package needed).
 */
class ResendHttpTransport extends AbstractTransport
{
    public function __construct(private readonly ?string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        if (blank($this->apiKey)) {
            throw new TransportException('Resend API key is not configured.');
        }

        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $envelope = $message->getEnvelope();

        $payload = [
            'from' => $this->format($email->getFrom()[0] ?? $envelope->getSender()),
            'to' => array_map(fn (Address $a) => $this->format($a), $this->recipients($email, $envelope)),
            'subject' => (string) $email->getSubject(),
        ];

        if ($email->getHtmlBody() !== null) {
            $payload['html'] = (string) $email->getHtmlBody();
        }

        if ($email->getTextBody() !== null) {
            $payload['text'] = (string) $email->getTextBody();
        }

        if ($email->getCc()) {
            $payload['cc'] = array_map(fn (Address $a) => $a->getAddress(), $email->getCc());
        }

        if ($email->getBcc()) {
            $payload['bcc'] = array_map(fn (Address $a) => $a->getAddress(), $email->getBcc());
        }

        if ($email->getReplyTo()) {
            $payload['reply_to'] = array_map(fn (Address $a) => $a->getAddress(), $email->getReplyTo());
        }

        $response = Http::withToken($this->apiKey)
            ->acceptJson()
            ->timeout(20)
            ->post('https://api.resend.com/emails', $payload);

        if ($response->failed()) {
            throw new TransportException(
                'Resend error '.$response->status().': '.$response->body()
            );
        }
    }

    private function recipients(Email $email, Envelope $envelope): array
    {
        return $email->getTo() ?: $envelope->getRecipients();
    }

    private function format(Address $address): string
    {
        return $address->getName() !== ''
            ? sprintf('%s <%s>', str_replace(['"', '<', '>'], '', $address->getName()), $address->getAddress())
            : $address->getAddress();
    }

    public function __toString(): string
    {
        return 'resend-http';
    }
}