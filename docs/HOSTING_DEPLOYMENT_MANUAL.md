# Hosting Deployment Manual

## Target

This manual is for the active project and assumes the current workspace is the live source of truth.

## Required environment

- Node.js 20+
- PHP 8.3+
- Composer
- Web server or hosting platform capable of serving the app
- Database compatible with Laravel
- Optional Redis for cache/session if used in production

## Required deployment checks

1. Confirm the active project is the working source.
2. Validate environment variables.
3. Run the release gate:
   - `npm run release:check`
4. Verify health endpoint response.
5. Deploy frontend build and backend app separately if the host requires split deployment.
6. Confirm the production environment variables are the final values.
7. Check application logs after deployment.

## Suggested production flow

### Frontend

```bash
npm install
npm run build
```

### Backend

```bash
cd backend
composer install --no-interaction --prefer-dist --no-progress
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Post-deployment verification

- `/api/health` returns status `ok`
- Critical routes return expected HTTP responses
- External providers are reachable
- Logs show no critical errors

## Rollback

If the deployment fails:
1. Revert to the last stable release.
2. Restore the previous environment values.
3. Re-run the release gate.
4. Confirm the health endpoint returns healthy status.

## Ownership

The release owner is responsible for signed approval before production deployment.
