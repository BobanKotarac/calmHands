# Zvuci (opciono)

Aplikacija reprodukuje kratak zvuk na kraju vežbe disanja i mudre (online izvor).

Ako želiš sopstveni zvuk, u `src/utils/playCompleteSound.ts` zameni `COMPLETE_SOUND_URI` sa lokalnim fajlom, npr.:

```ts
const { sound } = await Audio.Sound.createAsync(
  require('../assets/sounds/complete.mp3'),
  { shouldPlay: true, volume: 0.6 }
);
```

Dodaj ovde kratak MP3 (npr. 1–3 s) za „gotovo“ / uspeh.
