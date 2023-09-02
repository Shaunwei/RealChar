import { useRef, useCallback } from 'react';

const useWebRTC = onTrack => {
  const pcRef = useRef(null);
  const otherPCRef = useRef(null);
  const micStreamRef = useRef(null);
  const incomingStreamDestinationRef = useRef(null);
  const audioContextRef = useRef(null);

  const connectPeer = useCallback(async deviceId => {
    if (!pcRef.current) {
      pcRef.current = new RTCPeerConnection({
        sdpSemantics: 'unified-plan',
      });
      // Setup local webrtc connection just for echo cancellation.
      otherPCRef.current = new RTCPeerConnection({
        sdpSemantics: 'unified-plan',
      });
      pcRef.current.onicecandidate = e =>
        e.candidate &&
        otherPCRef.current.addIceCandidate(new RTCIceCandidate(e.candidate));
      otherPCRef.current.onicecandidate = e =>
        e.candidate &&
        pcRef.current.addIceCandidate(new RTCIceCandidate(e.candidate));
      pcRef.current.ontrack = onTrack;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;
      await stream.getTracks().forEach(function (track) {
        pcRef.current.addTrack(track, stream);
      });
      // Maintain a single audio stream for the duration of the call.
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      incomingStreamDestinationRef.current =
        audioContextRef.current.createMediaStreamDestination();
      incomingStreamDestinationRef.current.stream
        .getTracks()
        .forEach(function (track) {
          otherPCRef.current.addTrack(
            track,
            incomingStreamDestinationRef.current.stream
          );
        });
      // Negotiation between two local peers.
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      await otherPCRef.current.setRemoteDescription(offer);
      const answer = await otherPCRef.current.createAnswer();
      await otherPCRef.current.setLocalDescription(answer);
      await pcRef.current.setRemoteDescription(answer);

      return new Promise(resolve => {
        pcRef.current.oniceconnectionstatechange = e => {
          if (pcRef.current.iceConnectionState === 'connected') {
            resolve();
          }
        };
      });
    }
  }, []);

  const closePeer = () => {
    pcRef.current.close();
    pcRef.current = null;
    otherPCRef.current.close();
    otherPCRef.current = null;
  };

  return {
    pcRef,
    otherPCRef,
    micStreamRef,
    audioContextRef,
    incomingStreamDestinationRef,
    connectPeer,
    closePeer,
  };
};

export default useWebRTC;
