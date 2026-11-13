# Munchly 🍪

Snap your food, know your calories. Munchly is an Android-first calorie counter. You take a photo of a meal (or describe it), AI estimates the calories, protein, carbs and fat, and you log it in one tap.

> **"Munchly" is a working name.** An iPhone app called "Munchly: AI Recipes" already exists, so pick your final name before publishing. Renaming means changing `name` in `app.json` and the word "Munchly" in the screens.

## What's in the app

| Screen | What it does |
| --- | --- |
| **Onboarding** | Goal (lose / maintain / build), sex, age, height, weight and activity, then a daily calorie and macro plan (Mifflin–St Jeor formula). Gentler targets for under-18s. |
| **Today** | Calorie ring, protein/carbs/fat bars, today's meals grouped by breakfast, lunch, dinner and snack, streak counter, big **Scan food** button. |
| **Log food** | Take a photo, pick from the gallery, describe it in words, or enter it manually (always free). Review screen with portion size (½× to 2×), meal type, and remove-an-item. |
| **History** | 7-day chart against your goal, 7-day average, streak, and every logged day. |
| **Me** | Your details and targets, units (ft/lb or cm/kg), plan status, erase all data. |
| **Paywall** | Yearly and weekly plans. 3 free AI scans, then the paywall. **Payments are not connected yet** (see below). |

Everything a user logs stays on their phone. Photos go to the server only to be analyzed.

## Try it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd munchly
npm install
npx expo start
```

Press **w** to open it in your browser, or scan the QR code with the **Expo Go** app on an Android phone.

With no API key, scans return **demo data** (a sample chicken rice bowl), so you can click through every screen for free.

### Share a playable preview link

`npm run build:preview` packs the whole app into one HTML file, `dist-preview/munchly-preview.html`, that runs with no server: scans return the sample result. Host that file anywhere (or publish it as a Claude artifact) to let people tap through Munchly on their phone.

## Turn on real AI scans

1. Create an account at [console.anthropic.com](https://console.anthropic.com), add a payment method, and create an API key.
2. In the `munchly` folder, copy `.env.example` to a new file called `.env.local` and paste the key after `ANTHROPIC_API_KEY=`.
3. Restart `npx expo start`.

The key is only used by the server code in `src/server/analyze.ts`. It never goes into the app, so people can't pull it out of your APK.

### What each scan costs you

Munchly uses **Claude Opus 5.5** at `low` effort by default. A scan sends one resized photo (about 1,000 to 2,000 input tokens) and gets back a short answer. That works out to roughly **1 to 3 cents per scan**. This is an estimate; check real usage in the Anthropic console after a few days.

Setting `MUNCHLY_MODEL=claude-haiku-5-5` in `.env.local` makes scans dozens of times cheaper (a small fraction of a cent each). Try both on 20 or so of your own meal photos before deciding, because accuracy is what keeps reviews good.

For scale: someone scanning 5 meals a day costs roughly $0.35 to $1 a week on Opus 5.5, against a $4.99 weekly plan (Google keeps 15%).

## Put it online and on the Play Store

You'll need a free [Expo account](https://expo.dev) and a [Google Play Console](https://play.google.com/console) account ($25 one time).

### 1. Deploy the server (the AI part)

The `/api/analyze` route deploys to **EAS Hosting**:

```bash
npx expo export --platform web
npx eas-cli@latest deploy --prod
```

It prints your URL (something like `https://munchly.expo.app`). In the Expo dashboard, add `ANTHROPIC_API_KEY` as a **secret** environment variable for production, then deploy again. Steps can change between Expo versions, so follow [docs.expo.dev/eas/hosting](https://docs.expo.dev/eas/hosting/get-started/) if anything differs.

### 2. Point the app at the server

In `eas.json`, replace both `https://REPLACE-WITH-YOUR-URL.expo.app` with your URL.

### 3. Build the Android app

```bash
npx eas-cli@latest build -p android --profile preview      # an .apk to install on your own phone
npx eas-cli@latest build -p android --profile production   # an .aab to upload to Google Play
```

### Before you publish: checklist

- [ ] **Final name and package ID.** `android.package` in `app.json` (currently `com.munchly.app`) **can never change** after your first upload, so set it before building for the store.
- [ ] **Connect payments.** Google requires Google Play Billing for subscriptions. The easiest route is [RevenueCat](https://www.revenuecat.com): create the weekly and yearly products in Play Console, add `react-native-purchases`, and replace the `purchase()` function in `src/app/paywall.tsx`. The free-scan limit is in `src/lib/config.ts`.
- [ ] **Protect your AI bill.** Right now the 3-free-scans count lives on the phone, so someone who reinstalls gets 3 more, and anyone who finds your server URL could call it. Before spending on ads, have the server check the user's RevenueCat subscription before calling Claude. Setting `MUNCHLY_APP_KEY` adds a basic speed bump but isn't real protection.
- [ ] **Privacy policy URL.** Required by Google because the app uses the camera and sends photos to an AI service. Fill in the **Data safety** form and the **Health apps declaration** too.
- [ ] **Closed testing.** New personal Play accounts must run a closed test with at least 12 testers for 14 days before going public. Start this early.
- [ ] **Store listing.** Put keywords in the title, e.g. "Munchly: AI Calorie Counter" (30 characters max), and add screenshots.

## Settings (environment variables)

| Variable | Where | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | server | Turns on real scans. Without it, scans return demo data. |
| `MUNCHLY_MODEL` | server | Claude model ID. Default `claude-opus-5-5`. |
| `MUNCHLY_EFFORT` | server | `low`, `medium` or `high`. Default `low` (faster, cheaper). |
| `MUNCHLY_DEMO_MODE` | server | `true` forces demo data even when a key is set. |
| `MUNCHLY_APP_KEY` / `EXPO_PUBLIC_MUNCHLY_APP_KEY` | server / app | Optional shared key; set both to the same value. |
| `EXPO_PUBLIC_API_URL` | app | Server URL for Android builds. Leave empty for local web testing. |

## Where things live

```
src/
  app/                 screens (Expo Router: every file is a screen)
    (tabs)/            Today, History, Me
    onboarding.tsx     first-run questions and daily plan
    scan.tsx           photo / describe / manual logging and review
    paywall.tsx        subscription screen (payments still to connect)
    api/analyze+api.ts the server endpoint the app calls
  server/analyze.ts    the Claude prompt, request and result checking (server only)
  lib/                 calorie math, storage, theme, settings
  components/          buttons, cards, calorie ring, macro bars
```

Useful commands: `npm run typecheck`, `npm run lint`.

Built with Expo SDK 58. Munchly's numbers are AI estimates, not medical advice. The app says so in onboarding and on the **Me** screen.
