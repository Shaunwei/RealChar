const unlockAudioContext = (audioContext) => {
    if (audioContext.state === 'suspended') {
      const unlock = function() {
        audioContext.resume().then(function() {
          document.body.removeEventListener('touchstart', unlock);
          document.body.removeEventListener('touchend', unlock);
        });
      };
      document.body.addEventListener('touchstart', unlock, false);
      document.body.addEventListener('touchend', unlock, false);
    }
}

const playAudio = (audioPlayer, url) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      unlockAudioContext(audioContextRef.current);
    }

    return new Promise((resolve) => {
      audioPlayer.current.src = url;
      audioPlayer.current.muted = true;  // Start muted
      audioPlayer.current.play();
      audioPlayer.current.onended = resolve;
      audioPlayer.current.play().then(() => {
        audioPlayer.current.muted = false;  // Unmute after playback starts
      }).catch(error => alert(`Playback failed because: ${error}`));
    });
}

export const playAudios = async (audioContextRef, audioPlayer, audioQueue, setAudioQueue, setIsPlaying) => {
  console.log("playing audio");
  setIsPlaying(true);
  while (audioQueue.length > 0) {
    let data = audioQueue[0];
    let blob = new Blob([data], { type: 'audio/mp3' });
    let audioUrl = URL.createObjectURL(blob);
    await playAudio(audioContextRef, audioPlayer, audioUrl);
    setAudioQueue(oldQueue => oldQueue.slice(1));
  }
  setIsPlaying(false);
}
