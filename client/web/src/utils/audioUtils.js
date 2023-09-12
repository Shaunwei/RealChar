/**
 * src/utils/audioUtils.js
 * Audio playback.
 *
 * created by Lynchee on 7/16/23
 */

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
  bufferSource,
  initialize,
  setInitialize
) => {
  if (initialize) {
    unlockAudioContext(audioContextRef.current);
    setInitialize(false);
  }

  return new Promise(resolve => {
    audioPlayer.current.muted = true; // Start muted
    bufferSource.onended = resolve;
    bufferSource.start();
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
  playAudioFromNode,
  audioSourceNodeRef,
  initialize,
  setInitialize
) => {
  while (audioQueue.current.length > 0) {
    const audioBuffer = await audioContextRef.current.decodeAudioData(
      audioQueue.current[0]
    );
    const bs = audioContextRef.current.createBufferSource();
    bs.buffer = audioBuffer;
    bs.connect(audioSourceNodeRef.current);
    playAudioFromNode(bs, audioContextRef.current, true); // For enable avatar blend shapes

    await playAudio(
      audioContextRef,
      audioPlayer,
      bs,
      initialize,
      setInitialize
    );
    audioQueue.current.shift();
  }
  // done playing audios
  setIsPlaying(false);
};
