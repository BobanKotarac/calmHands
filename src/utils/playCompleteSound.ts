import { Audio } from 'expo-av';

// Kratak zvuk na kraju vežbe. Možeš zameniti sa require('../assets/sounds/complete.mp3') za lokalni fajl.
const COMPLETE_SOUND_URI = 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3';

let sound: Audio.Sound | null = null;

export async function playCompleteSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
    const { sound: s } = await Audio.Sound.createAsync(
      { uri: COMPLETE_SOUND_URI },
      { shouldPlay: true, volume: 0.6 }
    );
    sound = s;
    s.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        s.unloadAsync().catch(() => {});
        sound = null;
      }
    });
  } catch {
    // ignore
  }
}
