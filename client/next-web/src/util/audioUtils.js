// play a single audio chunk
const playAudio = (
    audioPlayer,
    bufferSource,
) => {
    return new Promise(resolve => {
        bufferSource.onended = ()=>{
            resolve();
        };
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
    audioContext,
    audioPlayerRef,
    audioQueueRef,
    isPlaying,
    setIsPlaying,
    audioSourceNode,
    popAudioQueueFront
) => {
    while (audioQueueRef.current.length > 0 && isPlaying) {
        // If the user leaves the page and buffer got deteched.
        if (audioQueueRef.current[0].detached) {
            return;
        }
        const audioBuffer = await audioContext.decodeAudioData(
            audioQueueRef.current[0]
        );
        const bs = audioContext.createBufferSource();
        bs.buffer = audioBuffer;
        bs.connect(audioSourceNode);

        await playAudio(
            audioPlayerRef,
            bs
        );
        popAudioQueueFront();
    }
    // done playing audios
    setIsPlaying(false);
};
