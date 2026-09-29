import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { getQuietMode } from './appSettings';

// Kratak zvuk na kraju vežbe. Možeš zameniti sa require('../assets/sounds/complete.mp3') za lokalni fajl.
const COMPLETE_SOUND_URI = 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3';

let player: AudioPlayer | null = null;

export async function playCompleteSound(): Promise<void> {
  try {
    if (await getQuietMode()) return;

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });

    if (player) {
      player.release();
      player = null;
    }

    const next = createAudioPlayer(COMPLETE_SOUND_URI);
    next.volume = 0.6;
    player = next;

    next.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        next.release();
        if (player === next) player = null;
      }
    });

    next.play();
  } catch {
    // ignore
  }
}
