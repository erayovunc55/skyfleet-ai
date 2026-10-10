# HeyTrip Integration Status

## Implemented foundation

The backend now contains a provider adapter and persistence foundation based on the supplied HeyTrip PDF:

- configurable HeyTrip base URL and credentials
- disabled-by-default live integration flag
- cached access token abstraction
- `GetQuotes`
- `CreateOrder`
- `GetOrderDetails`
- `cancelOrder`
- provider price and customer price separation
- configurable default 15% markup
- persistent `heytrip_orders` records for quote, booking, detail, and cancellation data

## Configuration

Add the real values only to the backend `.env` file. Never commit credentials:

```env
HEYTRIP_BASE_URL=https://vbk.heytripgocar.com
HEYTRIP_AUTHORIZATION_URL=
HEYTRIP_USERNAME=
HEYTRIP_PASSWORD=
HEYTRIP_CURRENCY=EUR
HEYTRIP_LANGUAGE=en-US
HEYTRIP_MARKUP_PERCENT=15
HEYTRIP_ENABLED=false
```

Keep `HEYTRIP_ENABLED=false` until HeyTrip confirms the authorization endpoint and sandbox credentials.

## Still required before live calls

The PDF does not specify the authorization URL or exact token response contract. Confirm:

- authorization endpoint URL
- request method and body fields
- token response field and expiry
- sandbox versus production base URL
- whether status updates are available as webhooks

The current adapter accepts either `accessToken` or `token` in the authorization response, but the endpoint itself must be confirmed before enabling it.

## Next implementation slice

1. Add a backend quote endpoint for the public transfer form.
2. Display HeyTrip products and customer prices in the website booking flow.
3. Persist the selected quote ticket and create the HeyTrip order after confirmation.
4. Add a scheduled detail synchronizer when the order mapping is approved.
5. Route internal cancellation through `cancelOrder` and record `cancelLossFee`.
