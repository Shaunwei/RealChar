import hark from "hark";

export const createRecorderSlice = (set, get) => ({
    // Media recorder
    isRecording: false,
    setIsRecording: (v)=>{
        set({isRecording: v});
    },
    mediaRecorder: null,
    connectMicrophone: () => {
        const deviceId = get().selectedMicrophone.values().next().value;
        if (get().mediaRecorder) return;
        navigator.mediaDevices
            .getUserMedia({
                audio: {
                    deviceId: deviceId ? deviceId  : undefined,
                },
            })
            .then(stream => {
                let micStreamSourceNode = get().audioContext.createMediaStreamSource(stream);
                let gainNode = get().audioContext.createGain();
                gainNode.gain.setValueAtTime(1.5, get().audioContext.currentTime);
                let delayNode = get().audioContext.createDelay(0.5);
                delayNode.delayTime.value = 0.1;
                let micStreamDestinationNode = get().audioContext.createMediaStreamDestination();
                let mediaRecorder = new MediaRecorder(micStreamDestinationNode.stream);
                micStreamSourceNode.connect(gainNode).connect(delayNode).connect(micStreamDestinationNode);
                // Temporary workaround for mimic stop event behavior, as for now on iOS 16 stop event doesn't fire.
                mediaRecorder.ondataavailable = event => {
                    let blob = new Blob([event.data], { type: 'audio/webm' });
                    get().sendOverSocket(blob);
                };
                set({
                    mediaRecorder: mediaRecorder,
                });
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
        });
    },
    // VAD
    vadEvents: null,
    isSpeaking: false,
    speakingMaxGap: 500, //in ms
    delayedSpeakingTimeoutID: null,
    vadEventsCallback: (voiceStartCallback, voiceInterimCallback, voiceEndCallback) => {
        let vadEvents = hark(get().micStream, { interval: 20, threshold: -50 });
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
        get().vadEvents?.stop();
        set({vadEvents: null,
            isSpeaking: false});
    }
});
