# Corner MMA

Corner MMA is an Expo app for logging MMA training and checking upcoming UFC events.

## Features

- Create, edit, and delete training sessions.
- Search sessions and filter by discipline.
- Save sessions on the device with AsyncStorage.
- Load upcoming MMA events from ESPN's public scoreboard API using Axios.
- Dark MMA-inspired theme, custom app icon, splash image, and bottom tabs.

## Run locally

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go, or run `npm run android` with an Android development environment.

## Build an Android APK

An Expo account is used by EAS Build. Sign in locally in the terminal; do not put account passwords or access tokens in this repository.

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The `preview` profile is configured to produce an installable APK. EAS prints a build page and download link when the build completes.

## MMA API

The Fight Card tab sends an unauthenticated GET request to:

`https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard`

The app shows loading, error, empty, and refresh states. No API key is required.

## Coursework note

The supplied assignment brief asks students to extend their earlier Expo project. This workspace was started as a new project because the earlier source was unavailable. Check with your instructor whether a fresh project is acceptable before submitting.
