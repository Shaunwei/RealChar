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
  useQuivr,
  selectedCharacter,
  setSessionId
) => {
  const socketRef = useRef(null);
  // initialize web socket and connect to server.
  const connectSocket = useCallback(() => {
    if (!socketRef.current) {
      if (!selectedCharacter) {
        return;
      }
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
        `/ws/${sessionId}?llm_model=${selectedModel}&platform=web&use_search=${useSearch}&use_quivr=${useQuivr}&character_id=${selectedCharacter.character_id}&language=${language}&token=${token}`;
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
  }, [
    token,
    onOpen,
    onMessage,
    selectedModel,
    preferredLanguage,
    useSearch,
    useQuivr,
    selectedCharacter,
    setSessionId,
  ]);

  // send message to server
  const send = useCallback(
    data => {
      console.log('message sent to server');
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(data);
      }
    },
    [socketRef]
  );

  const closeSocket = useCallback(() => {
    socketRef.current.close();
    socketRef.current = null;
  }, [socketRef]);

  return { socketRef, send, connectSocket, closeSocket };
};

export default useWebsocket;
