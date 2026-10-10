# Production Environment Template

## Purpose

This document defines the expected production environment structure for the active project. It is a template only and must be filled with real values for a secure deployment.

## Required variables

### Frontend

```env
VITE_API_URL=https://api.example.com/api
VITE_APP_NAME=SKYFLEET AIeski
```

### Backend / Laravel

```env
APP_NAME=SKYFLEET AIeski
APP_ENV=production
APP_KEY=base64:REPLACE_WITH_REAL_KEY
APP_DEBUG=false
APP_URL=https://app.example.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=skyfleet
DB_USERNAME=prod_user
DB_PASSWORD=secure_password

CACHE_STORE=redis
QUEUE_CONNECTION=database
SESSION_DRIVER=database
FILESYSTEM_DISK=local

GEOAPIFY_API_KEY=replace_with_real_key
GEOCODING_PROVIDER=geoapify
GEOAPIFY_ENDPOINT=https://api.geoapify.com/v1/geocode/search
GEOAPIFY_LANGUAGE=tr

META_WHATSAPP_VERIFY_TOKEN=replace_with_real_token
META_WHATSAPP_APP_SECRET=replace_with_real_secret

TWILIO_ACCOUNT_SID=replace_with_real_sid
TWILIO_AUTH_TOKEN=replace_with_real_token
TWILIO_FROM_NUMBER=replace_with_real_sender
TWILIO_MESSAGING_SERVICE_SID=replace_with_real_service
```

## Security rules

- Never commit real secrets to the repository.
- Use secrets manager or deployment environment vaults.
- Keep `APP_DEBUG=false` in production.
- Rotate expired API keys and tokens.
- Keep environment values strictly separated by environment.

## Deployment note

Use this template only as a safe reference. Real production values must be injected through the deployment platform or host configuration.
