<x-mail::message>
# Your driver is on the way

Hello {{ $passengerName }},

Your vehicle has started moving for transfer **{{ $bookingReference }}**.

Use the secure button below to follow your vehicle’s live location. You do not need to install an application.

<x-mail::button :url="$trackingUrl">
Track Your Vehicle
</x-mail::button>

For your security, do not forward this private tracking link to anyone.

Safe travels,<br>
**Skyfleet AI Operations**
</x-mail::message>