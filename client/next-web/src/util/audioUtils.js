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
    console.log('playAudios called');
    if (!audioContext) {
        console.log('audioContext not available, play cancelled.');
        return;
    }
    if (!audioPlayerRef.current) {
        console.log('audioPlayer not available, play cancelled.');
        return;
    }
    if (!audioSourceNode) {
        console.log('audioSourceNode not available, play cancelled.');
        return;
    }
    if (isPlaying) {
        console.log('Already playing, play cancelled.');
        return;
    }
    if (audioQueueRef.current?.length === 0) {
        console.log('Queue is empty, play cancelled.');
        return;
    }
    setIsPlaying(true);
    while (audioContext && audioPlayerRef.current && audioSourceNode && audioQueueRef.current?.length > 0) {
        // If the user leaves the page and buffer got deteched.
        if (audioQueueRef.current[0].detached) {
            console.log('Audio buffer detached, play cancelled.');
            return;
        }
        console.log('Playing audio ', audioQueueRef.current[0].byteLength, ' bytes...');
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
    console.log('Done playing audios')
    setIsPlaying(false);
};
