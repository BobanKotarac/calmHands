# CalmHands

CalmHands is a React Native (Expo) mobile app for managing anxiety, urges, and difficult moments in daily life. It combines mood tracking with in-the-moment coping tools so users can both reflect on patterns over time and get quick support when they need it most.

## What it does

- **Mood tracking** — log daily mood entries, view streaks, and see trends on a calendar heatmap.
- **SOS support** — a fast-access screen with grounding exercises and breathing techniques for moments of acute stress or anxiety.
- **Mudras** — guided hand mudra practices for calming and focus.
- **Thought log** — record and tag thoughts, with export to CSV for sharing with a therapist or for personal review.
- **Safety plan** — a personal, editable safety plan for high-risk moments.
- **Ritual plans** — build and run custom routines/rituals, with streak tracking.
- **Insights & weekly reflection** — charts and summaries (top triggers, weekly review) to help spot patterns over time.
- **Reminders & notifications** — local reminders to encourage consistent check-ins.
- **Localization** — multi-language support via i18next.
- **Accounts & premium** — Firebase-backed auth and a premium tier via context providers.

## Tech stack

- [Expo](https://expo.dev) / React Native
- TypeScript
- React Navigation (bottom tabs + native stack)
- Firebase (auth/backend)
- AsyncStorage / Expo SecureStore for local persistence
- react-native-chart-kit for charts, react-native-svg, Lottie, expo-av for animations/audio

## Getting started

```bash
npm install
npm start        # or: npm run ios / npm run android / npm run web
```

Requires the [Expo CLI](https://docs.expo.dev/get-started/installation/) and a simulator/device to run on.
