import { v4 as uuidv4 } from 'uuid';
import { getWsServerUrl } from '@/util/urlUtil';
import { languageCode } from '@/zustand/languageCode';

export const createWebsocketSlice = (set, get) => ({
  socket: null,
  socketIsOpen: false,

  sendOverSocket: (data) => {
    if (get().socket && get().socket.readyState === WebSocket.OPEN) {
      get().socket.send(data);
      console.log('message sent to server');
    } else {
      console.log('tries to send message to server but socket not open.');
    }
  },

  socketOnMessageHandler: (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message === '[end]\n' || message.match(/\[end=([a-zA-Z0-9]+)]/)) {
        get().appendChatContent();
        const messageIdMatches = message.match(/\[end=([a-zA-Z0-9]+)]/);
        if (messageIdMatches) {
          const messageId = messageIdMatches[1];
          get().setMessageId(messageId);
        }
      } else if (message === '[thinking]\n') {
        // Do nothing for now.
        // setIsThinking(true);
      } else if (message.startsWith('[+]You said: ')) {
        // [+] indicates the transcription is done.
        let msg = message.split('[+]You said: ');
        // Interrupted message has no end signal, so manually clear it.
        if (get().speechInterim != null) {
          get().appendChatContent();
        }
        get().setSender('user');
        get().appendInterimChatContent(msg[1]);
        get().appendChatContent();
        get().clearSpeechInterim();
      } else if (message.startsWith('[=]' || message.match(/\[=([a-zA-Z0-9]+)]/))) {
        // [=] or [=id] indicates the response is done
        get().appendChatContent();
      } else if (message.startsWith('[+&]')) {
        let msg = message.split('[+&]');
        get().appendSpeechInterim(msg[1]);
      } else if (message.startsWith('[+transcript]')) {
        const id = message.split('?id=')[1].split('&speakerId=')[0];
        const speakerId = message.split('&speakerId=')[1].split('&text=')[0];
        const text = message.split('&text=')[1].split('&timestamp=')[0];
        const timestamp = message.split('&timestamp=')[1].split('&duration')[0];
        const duration = message.split('&duration=')[1];
        get().appendTranscriptContent(id, speakerId, text, timestamp, duration);
      } else {
        get().setSender('character');
        get().appendInterimChatContent(event.data);

        // if user interrupts the previous response, should be able to play audios of new response
        get().setShouldPlayAudio(true);
      }
    } else {
      // binary data
      if (!get().shouldPlayAudio || get().isMute) {
        console.log('should not play audio');
        return;
      }
      get().pushAudioQueue(event.data);
      console.log(
        'audio arrival: ',
        event.data.byteLength,
        ' bytes, speaker: ',
        get().selectedSpeaker.values().next().value,
        ' mute: ',
        get().isMute,
        ' mic: ',
        get().selectedMicrophone.values().next().value,
        ' mute: ',
        get().disableMic,
        ' isPlaying: ',
        get().isPlaying,
        ' isPlaying(player): ',
        get().audioPlayerRef.current ? !get().audioPlayerRef.current.paused : undefined,
        ' audios in queue: ',
        get().audioQueue.length
      );
    }
  },

  connectSocket: () => {
    if (!get().socket) {
      if (!get().character.hasOwnProperty('character_id')) {
        return;
      }
      const sessionId = uuidv4().replace(/-/g, '');
      get().setSessionId(sessionId);
      const ws_url = getWsServerUrl(window.location.origin);
      const language =
        get().preferredLanguage.values().next().value === 'Auto Detect'
          ? ''
          : languageCode[get().preferredLanguage.values().next().value];
      const ws_path =
        ws_url +
        `/ws/${sessionId}?llm_model=${
          get().selectedModel.values().next().value
        }&platform=web&isJournalMode=${get().isJournalMode}&character_id=${
          get().character.character_id
        }&language=${language}&token=${get().token}`;
      let socket = new WebSocket(ws_path);
      socket.binaryType = 'arraybuffer';
      socket.onopen = () => {
        set({ socketIsOpen: true });
      };
      socket.onmessage = get().socketOnMessageHandler;
      socket.onerror = (error) => {
        console.log(`WebSocket Error: `);
        console.log(error);
      };
      socket.onclose = (event) => {
        console.log('Socket closed');
        set({ socketIsOpen: false });
      };
      set({ socket: socket });
    }
  },
  closeSocket: () => {
    get().socket?.close();
    set({ socket: null, socketIsOpen: false });
  },
  sessionId: '',
  setSessionId: (id) => {
    set({ sessionId: id });
  },

  token: '',
  setToken: (token) => {
    set({ token: token });
  },
});
