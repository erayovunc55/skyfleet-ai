# Hosting Environment Secret Map

## Purpose

This file documents which values must be provided by the hosting environment and must never be committed to source control.

## Frontend secrets

These values are visible in the browser and must be non-sensitive or public-safe:

- `VITE_API_URL`
- `VITE_APP_NAME`

## Backend secrets

These values must be stored in the deployment environment only:

- `APP_KEY`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `GEOAPIFY_API_KEY`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_WHATSAPP_APP_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_MESSAGING_SERVICE_SID`

## Rules

- Never commit real production secrets.
- Store production values in the hosting platform secret manager.
- Keep separate values for local/dev/staging/production.
- Rotate any leaked or expired value immediately.

## Deployment note

Only the environment platform should inject these values at run time. Source control must contain examples only.
