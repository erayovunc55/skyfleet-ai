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
