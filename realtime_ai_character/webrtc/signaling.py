from fastapi import WebSocket
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole
from realtime_ai_character.logger import get_logger
from realtime_ai_character.webrtc.tracks import TTSStreamingTrack

logger = get_logger(__name__)

pcs = set()

async def handle_rtc_signaling(websocket: WebSocket, user_id: str):
    logger.info(f"Start handling #{user_id} rtc signaling")

    # Construct offer
    params = await websocket.receive_json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    # Create peer.
    pc = RTCPeerConnection()
    pcs.add(pc)

    mic_processor = MediaBlackhole()
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logger.info("Connection state is %s for %s", pc.connectionState, user_id)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        logger.info("Track %s received for %s", track.kind, user_id)

        if track.kind == "audio":
            mic_processor.addTrack(track)
        else:
            raise RuntimeError(f"User: {user_id} RTC signaling service received unexpected track: {track.kind}")

        @track.on("ended")
        async def on_ended():
            logger.info("Track %s ended for %s", track.kind, user_id)
            await mic_processor.stop()

    tts_streaming_track = TTSStreamingTrack()
    pc.addTrack(tts_streaming_track)
    # handle offer
    await pc.setRemoteDescription(offer)
    await mic_processor.start()

    # send answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await websocket.send_json({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
    return tts_streaming_track

