/**
 * src/utils/audioUtils.js
 * Audio playback.
 *
 * created by Lynchee on 7/16/23
 */

import { setupAvatarLipSync } from '../components/AvatarView';

const unlockAudioContext = audioContext => {
  if (audioContext.state === 'suspended') {
    const unlock = function () {
      audioContext.resume().then(function () {
        document.body.removeEventListener('touchstart', unlock);
        document.body.removeEventListener('touchend', unlock);
      });
    };
    document.body.addEventListener('touchstart', unlock, false);
    document.body.addEventListener('touchend', unlock, false);
  }
};

// play a single audio chunk
const playAudio = (
  audioContextRef,
  audioPlayer,
  url,
  handleFirstInteractionAudio
) => {
  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    unlockAudioContext(audioContextRef.current);
    setupAvatarLipSync(audioContextRef.current, audioPlayer.current);
    handleFirstInteractionAudio(); // For the first interaction, we need to play a sound to unlock blend shapes
  }

  return new Promise(resolve => {
    audioPlayer.current.src = url;
    audioPlayer.current.muted = true; // Start muted
    audioPlayer.current.onended = resolve;
    audioPlayer.current
      .play()
      .then(() => {
        audioPlayer.current.muted = false; // Unmute after playback starts
      })
      .catch(error => {
        if (error.name === 'NotSupportedError') {
          alert(
            `Playback failed because: ${error}. Please check https://elevenlabs.io/subscription if you have encough characters left.`
          );
        } else {
          alert(`Playback failed because: ${error}`);
        }
      });
  });
};

// play all audio chunks
export const playAudios = async (
  audioContextRef,
  audioPlayer,
  audioQueue,
  setIsPlaying,
  handleFirstInteractionAudio
) => {
  while (audioQueue.current.length > 0) {
    let data = audioQueue.current[0];
    let blob = new Blob([data], { type: 'audio/mp3' });
    let audioUrl = URL.createObjectURL(blob);
    await playAudio(
      audioContextRef,
      audioPlayer,
      audioUrl,
      handleFirstInteractionAudio
    );
    audioQueue.current.shift();
  }

  // done playing audios
  setIsPlaying(false);
};
