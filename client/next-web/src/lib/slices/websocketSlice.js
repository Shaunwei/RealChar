import { v4 as uuidv4 } from "uuid";
import { getWsServerUrl } from "@/util/urlUtil";
import { languageCode } from "@/lib/languageCode";

export const createWebsocketSlice = (set, get) => ({
    socket: null,
    socketIsOpen: false,

    sendOverSocket: (data) => {
        if (
            get().socket && get().socket.readyState === WebSocket.OPEN
        ) {
            get().socket.send(data);
            console.log('message sent to server');
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
                get().setSender('user');
                get().appendInterimChatContent(msg[1]);
                get().appendChatContent();
            } else if (
                message.startsWith('[=]' || message.match(/\[=([a-zA-Z0-9]+)]/))
            ) {
                // [=] or [=id] indicates the response is done
                get().appendChatContent();
            } else {
                get().setSender('character');
                get().appendInterimChatContent(event.data);

                // if user interrupts the previous response, should be able to play audios of new response
                get().setShouldPlayAudio(true);
            }
        } else {
            // binary data
            if (!get().shouldPlayAudio) {
                console.log('should not play audio');
                return;
            }
            get().pushAudioQueue(event.data);
            if (get().audioQueue.length === 1) {
                get().setIsPlaying(true); // this will trigger playAudios in CallView.
            }
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
            const language = languageCode[get().preferredLanguage.values().next().value];
            const ws_path = ws_url +
                `/ws/${sessionId}?llm_model=${get().selectedModel.values().next().value}&platform=web&use_search=${get().enableGoogle}&use_quivr=${get().enableQuivr}&use_multion=${get().enableMultiOn}&character_id=${get().character.character_id}&language=${language}&token=${get().token}`;
            let socket = new WebSocket(ws_path);
            socket.binaryType = 'arraybuffer';
            socket.onopen = () => {
                set({ socketIsOpen: true });
            };
            socket.onmessage = get().socketOnMessageHandler;
            socket.onerror = error => {
                console.log(`WebSocket Error: ${error}`);
            };
            socket.onclose = event => {
                console.log('Socket closed');
                set({ socketIsOpen: false });
            };
            set({ socket: socket });
        }
    },
    closeSocket: () => {
        get().socket.close();
        set({ socket: null });
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
