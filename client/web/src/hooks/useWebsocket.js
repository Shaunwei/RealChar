/**
 * src/hooks/useWebsocket.js
 * Connect web socket. Send message to sever.
 *
 * created by Lynchee on 7/16/23
 */

import { useRef, useCallback } from 'react';
import { isIP, isIPv4 } from 'is-ip';
import { languageCode } from './languageCode';
import { v4 as uuidv4 } from 'uuid';
import { getHostName } from '../utils/urlUtils';

const useWebsocket = (
  token,
  onOpen,
  onMessage,
  selectedModel,
  preferredLanguage,
  useSearch,
  selectedCharacter,
  setSessionId
) => {
  const socketRef = useRef(null);

  // initialize web socket and connect to server.
  const connectSocket = useCallback(() => {
    if (!socketRef.current) {
      const sessionId = uuidv4().replace(/-/g, '');
      setSessionId(sessionId);
      const ws_scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      // Get the current host value
      // Generate the new host value with the same IP but different port
      var newHost = getHostName();

      var language = languageCode[preferredLanguage];

      const ws_path =
        ws_scheme +
        '://' +
        newHost +
        `/ws/${sessionId}?llm_model=${selectedModel}&platform=web&use_search=${useSearch}&character_id=${selectedCharacter.character_id}&language=${language}&tts=${selectedCharacter.tts}&token=${token}`;

      socketRef.current = new WebSocket(ws_path);
      const socket = socketRef.current;
      socket.binaryType = 'arraybuffer';
      socket.onopen = onOpen;
      socket.onmessage = onMessage;
      socket.onerror = error => {
        console.log(`WebSocket Error: ${error}`);
      };
      socket.onclose = event => {
        console.log('Socket closed');
      };
    }
  }, [setSessionId, onOpen, onMessage]);

  // send message to server
  const send = data => {
    console.log('message sent to server');
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  };

  const closeSocket = () => {
    socketRef.current.close();
    socketRef.current = null;
  };

  return { socketRef, send, connectSocket, closeSocket };
};

export default useWebsocket;
