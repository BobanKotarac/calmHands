# RevenueCat + App Stores — plan

Kod je već povezan (`react-native-purchases`, paywall, entitlement `pro`).  
Ovaj dokument je **checklist šta uraditi kasnije** kad budeš povezivao RevenueCat sa Apple / Google storeovima.

App IDs (trenutno u `app.json`):

| Platform | ID |
|----------|-----|
| iOS bundle | `com.bobypoz.calmhands` |
| Android package | `com.bobypoz.calmhands` |
| Entitlement (u kodu) | `pro` |

---

## 0) Već urađeno u app-u

- [x] SDK: `react-native-purchases`
- [x] `src/utils/revenueCat.ts` — configure, `logIn(firebaseUid)`, offerings, purchase, restore
- [x] `premiumContext` — Pro iz RC entitlement **`pro`** *ili* Firestore `users/{uid}.isPremium`
- [x] Paywall UI + Restore
- [x] Guest ne kupuje (Auth gate)
- [x] Placeholder keys u `.env.example` / `app.json → extra.revenueCat`

**Napomena:** kupovina **ne radi u Expo Go**. Samo EAS / TestFlight / Play internal-or-production build.

---

## 1) Priprema naloga (jednom)

### Apple
1. [ ] Apple Developer Program aktivan
2. [ ] App kreiran u **App Store Connect** sa bundle id `com.bobypoz.calmhands`
3. [ ] Paid Applications Agreement + banking + tax popunjeni (Subscriptions inače ne rade)
4. [ ] TestFlight build već može i bez IAP; IAP sandbox treba Agreements + proizvode

### Google
1. [ ] Google Play Console app sa package `com.bobypoz.calmhands`
2. [ ] Merchant / payments profil aktivan
3. [ ] License testers lista (za sandbox)

### RevenueCat
1. [ ] Napravi projekat na [app.revenuecat.com](https://app.revenuecat.com)
2. [ ] Dodaj **Apple App** → bundle `com.bobypoz.calmhands`
3. [ ] Dodaj **Google Play App** → package `com.bobypoz.calmhands`
4. [ ] Kopiraj **public SDK keys**:
   - iOS → `appl_...`
   - Android → `goog_...`
5. [ ] Ubaci u lokalni `.env` (ne commitovati):

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxx
```

6. [ ] Rebuild app (**EAS**) — keys ulaze u build; sama promena `.env` bez rebuilda nije dovoljna za native binary.

---

## 2) Apple — subscription proizvodi

1. [ ] App Store Connect → tvoj app → **Subscriptions**
2. [ ] Napravi **Subscription Group** npr. `CalmHands Pro`
3. [ ] Napravi proizvode (predlog ID-jeva — možeš drugačije, ali uskladi sa RC):

| Product ID (primer) | Tip | Cena (primer) |
|---------------------|-----|----------------|
| `calmhands_pro_monthly` | 1 month auto-renewable | 4.99 EUR |
| `calmhands_pro_yearly` | 1 year auto-renewable | 39.99 EUR |

4. [ ] Lokalizacije (EN + SR po želji), screenshot / review info ako traži
5. [ ] Status proizvoda: **Ready to Submit** (ili ekvivalent) pre testiranja
6. [ ] U RevenueCat → **Apple** → poveži App Store Connect API key (App Store Connect API Key sa In-App Purchase access) **ili** Shared Secret (stariji način)
7. [ ] RC → **Products** → Import / add ista product ID-jeva

---

## 3) Google Play — subscription proizvodi

1. [ ] Play Console → Monetize → **Subscriptions**
2. [ ] Napravi base plans (primer):

| Product ID | Base plan | Period |
|------------|-----------|--------|
| `calmhands_pro_monthly` | monthly | 1 month |
| `calmhands_pro_yearly` | yearly | 1 year |

3. [ ] Activate proizvode
4. [ ] RevenueCat → Google → upload **service account JSON** (Play Developer API sa pristupom subscriptions)
5. [ ] RC → Products → dodaj ista ID-jeva

---

## 4) RevenueCat — Entitlement + Offering

Ovo app već očekuje.

1. [ ] **Entitlements** → kreiraj `pro` (tačno ovo ime, ili promeni `extra.revenueCat.entitlementId` u `app.json` i rebuild)
2. [ ] Attach `calmhands_pro_monthly` i `calmhands_pro_yearly` na entitlement `pro`
3. [ ] **Offerings** → kreiraj offering (npr. `default`) i označi kao **Current**
4. [ ] U offering stavi packages:
   - `$rc_monthly` → monthly product
   - `$rc_annual` → yearly product  
   (ili custom package identifiers — paywall lista sve iz `current.availablePackages`)
5. [ ] Proveri u RC dashboardu **Customer** view posle test kupovine

---

## 5) Rebuild + TestFlight / Play test

### iOS
1. [ ] `eas build --platform ios --profile production` (sa RC key u env / EAS secrets)
2. [ ] `eas submit --platform ios` → TestFlight
3. [ ] Sandbox Apple ID na uređaju (Settings → App Store → Sandbox Account)
4. [ ] Uloguj se u CalmHands kao **registrovan** user (ne guest)
5. [ ] Paywall → kupi monthly/yearly → Pro treba da se aktivira
6. [ ] Testiraj **Restore purchases**

### Android
1. [ ] `eas build --platform android --profile production` (ili `preview`)
2. [ ] Upload na internal testing track
3. [ ] License tester nalog
4. [ ] Ista provera paywall / restore

### EAS secrets (preporuka)
Nemoj hardkodovati ključeve u git. U EAS:

```bash
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_xxx
eas secret:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value goog_xxx
```

---

## 6) Ručni Pro dok store još nije spreman

Za TestFlight testere bez IAP:

1. [ ] Firestore → `users/{uid}` → polje `isPremium: true`
2. [ ] App čita to kao fallback pored RevenueCat

Kad RC radi, možeš ostaviti fallback ili kasnije ukloniti.

---

## 7) Legal / App Review (pre production)

1. [ ] Privacy Policy URL (u app + store listing)
2. [ ] Terms of Use / EULA (Apple često traži za subscriptions)
3. [ ] Paywall već ima Restore — obavezno ostavi
4. [ ] U review notes: sandbox test nalog + kako aktivirati Pro
5. [ ] Nemoj koristiti “external” payment za digitalni Pro na iOS (App Store pravila)

---

## 8) Opciono kasnije (nije blokirajuće)

- [ ] RevenueCat **webhook** → Cloud Function → set `users/{uid}.isPremium` (server-side mirror)
- [ ] RevenueCat Paywalls UI (`react-native-purchases-ui`) umesto custom PaywallScreen
- [ ] Promo / intro offers u store + RC
- [ ] Customer Center (manage subscription)

---

## 9) Redosled (kratko)

```
1. Apple/Google agreements + app u store konzolama
2. RevenueCat projekat + API keys → .env / EAS secrets
3. Napravi subscription products u storeovima
4. Poveži store credentials u RevenueCat
5. Entitlement `pro` + Current Offering
6. EAS rebuild + TestFlight / Play internal
7. Sandbox kupovina + restore
8. App Review + production release
```

---

## Troubleshooting

| Problem | Šta proveriti |
|---------|----------------|
| Paywall kaže “No products yet” | Offering nije Current; product IDs ne matchuju; store credentials u RC; treba rebuild sa API key |
| Kupovina fail u Expo Go | Očekivano — koristi TestFlight/EAS |
| Kupovina OK ali `isPremium` false | Entitlement nije `pro`, ili product nije attachovan na entitlement |
| Guest ne vidi paywall / ne može | By design — prvo Auth |
| iOS “Cannot connect to iTunes” | Agreements / sandbox account / product nije Ready |

---

## Relevantni fajlovi u repo-u

- `src/utils/revenueCat.ts`
- `src/context/premiumContext.tsx`
- `src/screens/PaywallSccreen.tsx`
- `app.json` → `extra.revenueCat`
- `.env.example`
