# CalmHands

CalmHands is a React Native (Expo) mobile app for managing anxiety, urges, and difficult moments in daily life. It combines mood tracking with in-the-moment coping tools so users can both reflect on patterns over time and get quick support when they need it most.

## What it does

- **Mood tracking** — log daily mood entries, view streaks, and see 7/14-day trends.
- **SOS support** — fast-access breathing, grounding (5–4–3–2–1), mudras, and safety plan.
- **Physiological Sigh** — Huberman-style double-inhale breathing pattern (plus box / 4–7–8 / long exhale).
- **Thought log** — record and tag thoughts; history and insights for registered users.
- **Safety plan** — personal, editable plan for high-risk moments.
- **Ritual plans** — custom routines with streak tracking (account required; Pro for unlimited).
- **Insights & weekly reflection** — charts and summaries to spot patterns (Pro).
- **Reminders & notifications** — local reminders for mood check-ins.
- **Localization** — English + Serbian (i18next).
- **Guest vs account** — guests can try SOS tools; mood logging, plans, logs, and insights need an account.
- **Premium (RevenueCat)** — Pro entitlement wired for TestFlight; store products can be connected later. Full checklist: [docs/REVENUECAT.md](docs/REVENUECAT.md).

## Tech stack

- [Expo](https://expo.dev) SDK 57 / React Native
- TypeScript
- React Navigation (bottom tabs + native stack)
- Firebase Auth + Firestore
- RevenueCat (`react-native-purchases`) for subscriptions
- AsyncStorage / Expo SecureStore
- expo-audio, Lottie, react-native-svg / chart-kit

## Getting started

```bash
cp .env.example .env   # fill Firebase (+ optional RevenueCat keys)
npm install
npm start              # Expo Go for most UI
```

**Purchases / TestFlight:** Expo Go cannot buy. Use an EAS build:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Optional RevenueCat keys in `.env`:

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
```

Until store products are linked, you can grant Pro manually with Firestore `users/{uid}.isPremium = true`.

## Guest access (summary)

| Feature | Guest | Account |
|--------|-------|---------|
| Breathing / Grounding / Mudras / SOS | ✅ | ✅ |
| Mood log | ❌ | ✅ |
| Plans / thought logs / insights / safety plan | ❌ | ✅ (Pro where noted) |

## Scripts

```bash
npm start
npm run start:clean    # clear Metro cache
npm run start:phone    # LAN with local IP
npm test
```
