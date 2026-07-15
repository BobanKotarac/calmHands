# Predlog UI poboljšanja – CalmHands

Konkretne izmene po ekranima, bez novih paketa (koristiš `react-native-animatable`, `expo-linear-gradient`, `Animated` iz RN).

---

## 1. Home ekran

### 1.1 Hero / dobrodošlica
- **Sada:** običan tekst "Dobrodošao nazad".
- **Predlog:** veći font za pozdrav (npr. 26–28), font weight 600; ispod manji, sivi podnaslov (npr. "Danas, 2. mart"). Jedan blok vizuelno jasno "hero" – više vazduha (marginBottom 20).

### 1.2 Kartica "Danas" – glavni CTA
- **Sada:** plavo dugme "Unesi današnji mood".
- **Predlog:**
  - `expo-linear-gradient` za dugme (npr. plavi → tammo plavi), `borderRadius: 14`, blago veći padding (14–16).
  - Na pritisak: `react-native-animatable` – `<Animatable.View animation="pulse" duration={200}>` ili kratak `scale` preko `Animated` (0.98 na press in, 1 na press out).
  - Ako nema unosa danas: blaga ikona ili emoji levo od teksta (npr. ✏️) da deluje kao poziv na akciju.

### 1.3 Streak brojevi
- **Sada:** tri iste male kartice u redu.
- **Predlog:**
  - Broj (streak, avg, ritual) u većem fontu (24–26), font weight 700; label ostaje manji i sivi.
  - Opciono: kartica sa najvećim streak-om malo istaknuta – tanak `LinearGradient` border (npr. zelena) ili `borderColor: '#10B981'`, `borderWidth: 1`.

### 1.4 "Poslednji mood" kartica
- **Sada:** emoji + tekst + ProgressChart.
- **Predlog:**
  - Blagi `LinearGradient` u pozadini kartice (npr. od `meta.color` sa opacity 0.15 do transparent). Ostaje tamna tema, ali kartica dobija malo "boje" bez guranja u lice.
  - Emoji u većem razmeru (npr. 52) ako je to glavni vizuelni element.

### 1.5 Preporuke (recommendations)
- **Sada:** obojeni pravougaonici.
- **Predlog:** iste boje, ali `borderRadius: 16`, malo više padding (14). Prva preporuka može imati blagi shadow (elevation na Android, shadowOpacity na iOS) da deluje kao "glavna" kartica.

### 1.6 Quick actions (SOS, Mudre, Logovi, Insights)
- **Sada:** sva dugmad iste visine, samo boja različita.
- **Predlog:**
  - SOS ostaje kao primarno – veći padding (npr. 14–16), možda blagi gradient (zelena → tamnija zelena).
  - Ostala tri: konzistentan `borderRadius: 14`, na pritisak `activeOpacity={0.7}` da se vidi feedback.
  - Opciono: mala ikonica ili emoji levo od teksta (već imaš emoji u tekstu – može ostati, ili zameniti s ikonama kasnije).

---

## 2. SOS ekran

### 2.1 Naslov i podnaslov
- **Sada:** centriran tekst.
- **Predlog:**
  - Naslov "SOS" malo veći (24), font weight 700. Podnaslov ostaje, ali `lineHeight: 24`, `maxWidth: '90%'` da ne razvlači previše na tabletima.
  - Opciono: vrlo blag `LinearGradient` u pozadini celog ekrana (tamno plavi → #0B1220) da ekran deluje smirenije, ne "prazno".

### 2.2 Sigurnosni plan kartica
- **Sada:** plavi border, tamna pozadina.
- **Predlog:** ostaje isto, ali unutrašnji razmaci malo veći (gap: 14, padding: 18). Link "Izmeni plan" kao dugme (padding 10, borderRadius 10) umesto samo teksta – lakše za tap.

### 2.3 Akcije (Disanje, Grounding, Mudra, Log)
- **Sada:** jednobojne kartice.
- **Predlog:**
  - Svaka kartica: `borderRadius: 16`, `padding: 20`. Na pritisak haptic (već imaš) + `activeOpacity={0.85}`.
  - Prva akcija (Disanje) može imati blagi gradient (npr. zelena/teal) da vizuelno vodi korisnika ka njoj.

---

## 3. Tracker (Mood) ekran

### 3.1 Brzi izbor 1–5
- **Sada:** obični TouchableOpacity chips.
- **Predlog:**
  - Izabrani broj: blago veći (scale 1.05) ili tanak border u boji mood-a (npr. za 5 zelena, za 1 crvena). Možeš koristiti `react-native-animatable` – `<Animatable.View animation={active ? "pulse" : undefined}>` samo za aktivni.
  - Na pritisak: kratak scale 0.97 (Animated ili animatable) da se oseti "klik".

### 3.2 Dugme "Sačuvaj"
- **Sada:** zelena pozadina.
- **Predlog:** `LinearGradient` (zelena → tamnija zelena), `borderRadius: 14`, font weight 600. Kada je `disabled` (saving), opacity 0.7 umesto promene boje.

### 3.3 Trend chart
- **Sada:** LineChart u kartici.
- **Predlog:** Ostaje, samo kartica sa malo više padding-a (14) i `borderRadius: 18` da bude konzistentna sa Home.

---

## 4. Opšte (svi ekrani)

### 4.1 Konzistentni tokeni
- **Predlog:** Jedan fajl npr. `src/theme.ts` ili `constants/theme.ts`:
  - `background: '#0B1220'`, `card: '#111827'`, `cardBorder: '#1F2937'`
  - `primary: '#3B82F6'`, `success: '#10B981'`, `danger: '#EF4444'`
  - `radiusCard: 18`, `radiusButton: 14`, `paddingCard: 16`
  - Tako svi ekrani koriste iste vrednosti – brže izmene i konzistentan izgled.

### 4.2 Povratna informacija na pritisak
- **Predlog:** Gde god imaš `TouchableOpacity`, postavi `activeOpacity={0.7}` ili `0.8` (osim gde već imaš). Na važnim CTA (npr. "Unesi mood", "Sačuvaj") možeš dodati kratak scale (0.98) preko `Animated` u onPressIn/onPressOut.

### 4.3 Tipografija
- **Predlog:** Sekcijski naslovi (npr. "Preporuke", "Trend") ujednačeni: `fontSize: 18`, `fontWeight: '600'`, `color: 'white'`. Podnaslovi `fontSize: 12` ili `13`, `color: '#94A3B8'`. Jedan "hero" naslov po ekranu (npr. pozdrav na Home) može biti 24–26.

---

## Redosled implementacije

1. **Theme fajl** – izvuci boje i radius u jedan fajl, zameni na 1–2 ekrana da vidiš efekat.
2. **Home** – hero tekst, gradient na glavno dugme, malo istaknuta streak kartica, gradient na "Poslednji mood".
3. **Tracker** – istaknut aktivni mood (border/scale), gradient na "Sačuvaj".
4. **SOS** – veći naslov, malo više vazduha, gradient na prvu akciju.
5. **activeOpacity i eventualno scale** na svim CTA dugmićima.

Ako želiš, mogu sledeći korak da napišem kao konkretan patch (npr. samo `theme.ts` + izmene na Home za hero i jedno dugme sa gradientom).
