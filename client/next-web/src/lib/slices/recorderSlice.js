import hark from "hark";

export const createRecorderSlice = (set, get) => ({
    // Media recorder
    isRecording: false,
    setIsRecording: (v)=>{
        set({isRecording: v});
    },
    chunks: [],
    mediaRecorder: null,
    connectMicrophone: () => {
        const deviceId = get().selectedMicrophone.values().next().value;
        if (get().mediaRecorder) return;
        navigator.mediaDevices
            .getUserMedia({
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    echoCancellation: true,
                },
            })
            .then(stream => {
                let mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    set({chunks: [...get().chunks, event.data]});
                };
                mediaRecorder.onstop = () => {
                    let blob = new Blob(get().chunks, { type: 'audio/webm' });
                    get().sendOverSocket(blob);
                    set({chunks: []});
                };
                set({mediaRecorder: mediaRecorder});
            })
            .catch(function (err) {
                console.log('An error occurred: ' + err);
                if (err.name === 'NotAllowedError') {
                    alert(
                        'Permission Denied: Please grant permission to access the microphone and refresh the website to try again!'
                    );
                } else if (err.name === 'NotFoundError') {
                    alert(
                        'No Device Found: Please check your microphone device and refresh the website to try again.'
                    );
                }
                get().closeMediaRecorder();
                // TODO: Route to / ?
            });
    },
    startRecording: () => {
        console.log('start recording');
        if (!get().mediaRecorder) return;
        get().mediaRecorder.start();
        get().setIsRecording(true);
    },

    stopRecording: () => {
        console.log('stop recording');
        if (!get().mediaRecorder) return;
        get().mediaRecorder.stop();
        get().setIsRecording(false);
    },
    closeMediaRecorder : () => {
        get().stopRecording();
        set({
            mediaRecorder: null,
            chunks: []
        });
    },
    // VAD
    vadEvents: null,
    isSpeaking: false,
    speakingMaxGap: 500, //in ms
    delayedSpeakingTimeoutID: null,
    vadEventsCallback: (stream, voiceStartCallback, voiceInterimCallback, voiceEndCallback) => {
        if (!get().vadEvents) {
            let vadEvents = hark(stream, { interval: 20 });
            vadEvents.on('speaking', () => {
                voiceStartCallback();
                if (!get().isSpeaking) {
                    set({isSpeaking: true});
                } else {
                    clearTimeout(get().delayedSpeakingTimeoutID);
                }
            });
            vadEvents.on('stopped_speaking', () => {
                if (get().isSpeaking) {
                    const task = setTimeout(() => {
                        voiceEndCallback();
                        set({isSpeaking: false})
                    }, get().speakingMaxGap);
                    set({delayedSpeakingTimeoutID: task});
                    voiceInterimCallback();
                }
            });
            vadEvents.suspend();
            set({vadEvents: vadEvents});
        }
    },
    enableVAD: () =>{
        get().vadEvents?.resume();
    },
    disableVAD: () => {
        if (get().vadEvents) {
            get().vadEvents.suspend();
        }
    },
    closeVAD: () => {
        get().vadEvents.stop();
        set({vadEvents: null,
            isSpeaking: false});
    }
});
