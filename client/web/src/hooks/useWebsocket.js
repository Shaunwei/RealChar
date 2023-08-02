/**
 * src/hooks/useWebsocket.js
 * Connect web socket. Send message to sever.
 * 
 * created by Lynchee on 7/16/23
 */

import { useRef, useCallback } from 'react';
import {isIP, isIPv4} from 'is-ip';
import { languageCode } from './languageCode';

const useWebsocket = (token, onOpen, onMessage, selectedModel, preferredLanguage, useSearch, selectedCharacter) => {
    const socketRef = useRef(null);

    // initialize web socket and connect to server.
    const connectSocket = useCallback(() => {
        if (!socketRef.current) {
            const clientId = Math.floor(Math.random() * 1010000000);
            const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
            // Get the current host value
            var currentHost = window.location.host;

            // Split the host into IP and port number
            var parts = currentHost.split(':');

            // Extract the IP address and port number
            var hostname = parts[0];
            // Local deployment uses 8000 port by default.
            var newPort = '8000';

            if (!(hostname === 'localhost' || isIP(hostname))) {
                hostname = 'api.' + hostname;
                newPort = window.location.protocol === "https:" ? 443 : 80;
            }

            // Generate the new host value with the same IP but different port
            var newHost = hostname + ':' + newPort;

            var language = languageCode[preferredLanguage];

            const ws_path = ws_scheme + '://' + newHost + `/ws/${clientId}?llm_model=${selectedModel}&platform=web&use_search=${useSearch}&character_id=${selectedCharacter.character_id}&language=${language}&token=${token}`;

            socketRef.current = new WebSocket(ws_path);
            const socket = socketRef.current;
            socket.binaryType = 'arraybuffer';
            socket.onopen = onOpen;
            socket.onmessage = onMessage;
            socket.onerror = (error) => {
                console.log(`WebSocket Error: ${error}`); 
            };
            socket.onclose = (event) => {
                console.log("Socket closed"); 
            };
        }
    }, [onOpen, onMessage]);

    // send message to server
    const send = (data) => {
        console.log("message sent to server");
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(data);
        }
    };

    const closeSocket = () => {
        socketRef.current.close();
        socketRef.current = null;
    }

    return { socketRef, send, connectSocket, closeSocket };
};

export default useWebsocket;
