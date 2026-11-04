# Skyfleet Driver App

Web and Android driver application for live transfer operations.

The home-screen completed count is calculated for the current calendar month in
the supplier's timezone. It rolls over automatically at the start of each month;
completed transfers remain available in the history.

## Development

```bash
npm install
npm run dev
```

## Build (Web)

```bash
npm run build
```

## Build Android APK (Debug)

Android SDK is expected at `C:\Users\<you>\AppData\Local\Android\Sdk`.

```bash
npm run android:apk
```

APK output:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## Android Notes

- Android project root: `driver-app/android`
- Capacitor config: `capacitor.config.json`
- Background GPS tracking is enabled for native Android builds using Capacitor + `@capacitor-community/background-geolocation`.
- Android 13+ requires notification permission for persistent background tracking.
# Production monthly-count release

The recovered driver sources preserve the production password reset, slide
confirmation, GPS details, WhatsApp preferences, supplier application, and route
behavior. Only the home summary changes to the supplier-local monthly count.
Historical reservations are not deleted.

Build with `VITE_API_URL=https://skytriptransfer.com/api`, then run
`node scripts/build-driver-monthly-release.mjs <live-controller> <live-index>
<live-assets-dir> <new-output-dir>` from the repository root. The packager rejects
an unexpected production baseline, applies the approved monthly query to that
controller while retaining its ownership/history scopes, and preserves the
existing guest branch and stylesheet. It never changes production itself.

Before deployment, back up the live controller and driver index outside the web
root, validate PHP syntax and monthly ownership/rollover tests, and check guest,
login, and driver flows. Upload new immutable assets first; replace the controller
and index atomically. Retain all old assets for rollback and existing clients.
Rollback restores those two backed-up files and reloads PHP-FPM. No database
migration or reservation deletion is required.
