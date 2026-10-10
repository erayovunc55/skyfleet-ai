# Skyfleet Driver App

Web and Android driver application for live transfer operations.

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
