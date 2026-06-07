# Forever — native mobile shell (Capacitor)

Native iOS + Android wrapper around the live Forever web app. The native app is
a thin shell whose WebView loads the production site (`server.url` in
`capacitor.config.ts`), so it is **identical to the web app** and updates the
instant the web app is redeployed — no app rebuild/resubmission for UI changes.

What the native layer adds on top of the web app:
- **Native push** (FCM on Android, APNs on iOS) for closed-app heartbeats
- **Native haptics** on the heartbeat tap
- Branded **app icon + splash screen**, native status bar, safe-area handling

> The web-side glue lives in the main app, not here: `lib/native.ts`
> (`isNative()`, `nativeHaptic()`, `registerNativePush()`), with the server
> token store in `app/api/push/register-device` and FCM send in `lib/fcm.ts`
> (called from `app/api/push/heartbeat`).

---

## Prerequisites already installed on the VPS
- Node 20, JDK 17 (`/usr/lib/jvm/java-17-amazon-corretto.x86_64`)
- Android SDK 34 at `~/android-sdk` (`platform-tools`, `platforms;android-34`,
  `build-tools;34.0.0`)

```bash
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto.x86_64
```

---

## Android — build the APK (on the VPS, free)

```bash
cd mobile
npm ci                 # first time only
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon          # debug, installs immediately
# -> app/build/outputs/apk/debug/app-debug.apk
```

The latest debug APK is staged at `mobile/dist/Forever-debug.apk`.
Copy it off the server and install on the phone (enable "Install unknown apps"):

```bash
# from your Windows PC / laptop:
scp ec2-user@<vps-host>:/opt/forever/mobile/dist/Forever-debug.apk .
```

### Release APK (for Play Store / a non-expiring build) — later
1. Create a keystore once:
   `keytool -genkey -v -keystore forever.keystore -alias forever -keyalg RSA -keysize 2048 -validity 10000`
2. Add a `signingConfigs` block + `release` config in `android/app/build.gradle`.
3. `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`.

---

## iOS — build + install (free, no Mac, no $99 account)

You don't own a Mac, so the `.ipa` is compiled on a **free GitHub Actions macOS
runner** and installed from your **Windows PC** with a **free Apple ID**.

1. **Build:** push this repo to GitHub, then run the **"Build iOS (unsigned
   IPA)"** workflow (`.github/workflows/ios.yml`) from the Actions tab (or push a
   tag `ios-v1`). Download the `Forever-unsigned-ipa` artifact.
2. **Install:** on Windows, open **Sideloadly** (https://sideloadly.io), plug in
   the iPhone, drag in `Forever-unsigned.ipa`, sign in with a **free Apple ID**,
   click Start.
3. On the iPhone: Settings → General → VPN & Device Management → trust your
   Apple ID, then launch **Forever**.

**Free Apple ID limits:** the app works for **7 days**, then re-run Sideloadly
(or let AltStore auto-refresh on WiFi). Max ~3 sideloaded apps.

**Zero-setup alternative (today):** on the iPhone, open the site in Safari →
Share → **Add to Home Screen** to run the identical app as a PWA — no build at
all.

---

## Native push (FCM) — enabling it

Push code is wired and works; it just needs a **free Firebase project** to send.

1. Create a Firebase project → add an **Android app** with package
   `com.forever.app` → download `google-services.json` into
   `android/app/google-services.json`.
2. Apply the google-services Gradle plugin (classpath in `android/build.gradle`,
   `apply plugin` in `android/app/build.gradle`).
3. In Firebase → Project Settings → Service accounts → **Generate new private
   key**. Paste that JSON (one line) into `FIREBASE_SERVICE_ACCOUNT` in
   `/opt/forever/.env.production`, then redeploy the web app:
   `docker compose --env-file .env.production up -d --build app`.
4. Rebuild the APK. Android push now works end-to-end.

**iOS push** additionally needs the **$99/yr Apple Developer Program** (free
Apple IDs can't enable the APNs entitlement): upload an APNs key (.p8) to
Firebase and rebuild with a real signing team. No code changes required —
`lib/fcm.ts` already routes iOS through FCM→APNs.

---

## Updating the app after web changes
UI/logic changes ship automatically (the WebView loads the live site). Rebuild
the native app only when you change `capacitor.config.ts`, native plugins, the
icon/splash, or the app version.
