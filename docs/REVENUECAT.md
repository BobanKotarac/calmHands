# RevenueCat (TestFlight-ready wiring)

Code is wired. Store products can be connected later.

## What was added
- `react-native-purchases`
- `src/utils/revenueCat.ts` — configure / login / offerings / purchase / restore
- `premiumContext` — Pro from RevenueCat entitlement `pro` **or** Firestore `users/{uid}.isPremium` (manual TestFlight flag)
- `PaywallScreen` — live packages when offerings exist; restore button; clear empty-state copy

## Keys
Put public SDK keys in `.env` (preferred) or `app.json → extra.revenueCat`:

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
```

Entitlement id defaults to `pro`.

## TestFlight flow
1. Create RevenueCat project → copy iOS public API key into `.env`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios` (or upload IPA to App Store Connect → TestFlight)
4. Later: App Store Connect subscriptions → link in RevenueCat → Offering → products appear on paywall

## Manual Pro for testers (before store products)
In Firestore set `users/{uid}.isPremium = true` for a registered account.

## Note
Purchases do **not** work in Expo Go — only EAS / TestFlight / Play builds.
