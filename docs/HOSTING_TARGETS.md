# Hosting Targets

## Supported deployment patterns

This project is structured to support deployment through either a single-host setup or a split frontend + backend setup.

### Option A: Single host (simplest)

- Serve the frontend build output from the root web directory.
- Serve the Laravel backend from the backend project directory.
- Configure a reverse proxy or server block to route API requests to the backend.

### Option B: Split host

- Frontend deployed to a static host or CDN.
- Backend deployed to a PHP-capable server.
- API domain points to the backend server.
- Frontend domain points to the static frontend host.

## Recommended production topology

For a production deployment, keep these boundaries clear:

- frontend domain: public UI
- api domain: Laravel backend
- database: managed database service
- queue and cache: managed service if available

## Important rules

- Keep the API base URL in environment config only.
- Never hardcode production secrets in frontend files.
- Keep `.env` and secret values outside the repository.
- Verify domain-to-API routing before final release.

## Deployment direction

Use the current workspace as the source of truth and deploy only the active project branch that passes the release gate.
