import { useRef, useCallback } from 'react';


const negotiate = (pc, ws) => {
    return pc.createOffer().then(function (offer) {
        console.log('offer')
        console.log(offer)
        return pc.setLocalDescription(offer);
    }).then(function() {
        // wait for ICE gathering to complete
        return new Promise(function(resolve) {
            if (pc.iceGatheringState === 'complete') {
                console.log('iceGatheringState complete')
                resolve();
            } else {
                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        console.log('iceGatheringState complete')
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
    }).then(function() {
        var offer = pc.localDescription;
        return new Promise(function(resolve) {
            ws.addEventListener('message', function listener(evt) {
                var answer = JSON.parse(evt.data);
                ws.removeEventListener('message', listener);
                pc.setRemoteDescription(answer).then(function() {
                    resolve();
                });
            });
            ws.send(JSON.stringify({
                'sdp': offer.sdp,
                'type': offer.type,
            }));
        });
    }).catch(function(e) {
        alert(e);
    });
}

const useWebRTC = (socketRef, onTrack) => {
    const pcRef = useRef(null);
    const streamRef = useRef(null);

    const connectPeer = useCallback(() => {
        if (!pcRef.current) {
            const pc = new RTCPeerConnection({
                sdpSemantics: 'unified-plan'
            });
            pcRef.current = pc;
            pcRef.current.ontrack = onTrack;
            navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }).then(function (stream) {
                streamRef.current = stream;
                stream.getTracks().forEach(function (track) {
                    pcRef.current.addTrack(track, stream);
                });
                return negotiate(pcRef.current, socketRef.current);
            }).catch(function (err) {
                console.log(err.name + ": " + err.message);
            }, function () {
                pc.close();
                pcRef.current = null;
            });
        }
    }
    , []);

    const closePeer = () => {
        pcRef.current.close();
        pcRef.current = null;
    }

    return { pcRef, streamRef, connectPeer, closePeer}
};

export default useWebRTC;