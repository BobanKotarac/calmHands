# Zvuci (opciono)

Aplikacija reprodukuje kratak zvuk na kraju vežbe disanja i mudre (online izvor).

Ako želiš sopstveni zvuk, u `src/utils/playCompleteSound.ts` zameni `COMPLETE_SOUND_URI` sa lokalnim fajlom, npr.:

```ts
const player = createAudioPlayer(require('../assets/sounds/complete.mp3'));
player.volume = 0.6;
player.play();
```

Dodaj ovde kratak MP3 (npr. 1–3 s) za „gotovo“ / uspeh.
