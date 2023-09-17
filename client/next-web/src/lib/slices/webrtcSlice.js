export const createWebRTCSlice = (set, get) => ({
    // Audio player.
    shouldPlayAudio: true,
    setShouldPlayAudio: (v) => {
        set({shouldPlayAudio: v});
    },
    audioQueue: [],
    pushAudioQueue: (audio) => {
        set((state) => ({audioQueue: [...state.audioQueue, audio]}));
    },
    popAudioQueueFront: () => {
        set((state)=>({audioQueue: [...state.audioQueue.slice(1)]}));
    },
    isPlaying: false,
    setIsPlaying: (v) => {
        set({isPlaying: v});
    },
    audioPlayerRef: null,
    setAudioPlayerRef: (ref) => {
        set({audioPlayerRef: ref});
    },
    stopAudioPlayback: () => {
        if (get().audioPlayerRef && get().audioPlayerRef.current) {
            get().audioPlayerRef.current.pause();
            get().setShouldPlayAudio(false);
        }
        set({audioQueue: []});
        get().setIsPlaying(false);
    },
    // Peer related.
    pc: null,
    otherPC: null,
    micStream: null,
    incomingStreamDestination: null,
    audioContext: null,

    rtcConnectionEstablished: false,
    connectPeer: async(onTrack) => {
        if (get().pc) {
            console.log('Should not call connectPeer if webrtc connection already established!');
        }
        let pc = new RTCPeerConnection({
            sdpSemantics: 'unified-plan',
        });
        // Setup local webrtc connection just for echo cancellation.
        let otherPC = new RTCPeerConnection({
            sdpSemantics: 'unified-plan',
        });
        pc.onicecandidate = e =>
            e.candidate &&
            otherPC.addIceCandidate(new RTCIceCandidate(e.candidate));
        otherPC.onicecandidate = e =>
            e.candidate &&
            pc.addIceCandidate(new RTCIceCandidate(e.candidate));
        pc.ontrack = onTrack;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: get().selectedMicrophone,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });
        let micStream = stream;
        await stream.getTracks().forEach(function (track) {
            pc.addTrack(track, stream);
        });
        // Maintain a single audio stream for the duration of the call.
        let audioContext= new (window.AudioContext ||
            window.webkitAudioContext)();
        let incomingStreamDestination=
            audioContext.createMediaStreamDestination();
        incomingStreamDestination.stream
            .getTracks()
            .forEach(function (track) {
                otherPC.addTrack(
                    track,
                    incomingStreamDestination.stream
                );
            });
        // Negotiation between two local peers.
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await otherPC.setRemoteDescription(offer);
        const answer = await otherPC.createAnswer();
        await otherPC.setLocalDescription(answer);
        await pc.setRemoteDescription(answer);
        set({
            pc: pc,
            otherPC: otherPC,
            micStream: micStream,
            incomingStreamDestination: incomingStreamDestination,
            audioContext: audioContext,
        });

        return new Promise(resolve => {
            pc.oniceconnectionstatechange = e => {
                if (pc.iceConnectionState === 'connected') {
                    set({rtcConnectionEstablished: true});
                    resolve();
                }
            };
        });
    },
    closePeer : () => {
        get().pc.close();
        get().otherPC.close();
        set({
            pc: null,
            otherPC: null
        });
    }
});
