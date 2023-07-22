/**
 * src/hooks/useWebsocket.js
 * Connect web socket. Send message to sever.
 * 
 * created by Lynchee on 7/16/23
 */

import { useRef, useCallback } from 'react';

const useWebsocket = (token, onOpen, onMessage, selectedModel) => {
    const socketRef = useRef(null);

    // initialize web socket and connect to server.
    const connectSocket = useCallback(() => {
        if (!socketRef.current) {
            const clientId = Math.floor(Math.random() * 1010000);
            const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
            // const ws_path = ws_scheme + '://realchar.ai:8000/ws/' + clientId;
            // Get the current host value
            var currentHost = window.location.host;

            // Split the host into IP and port number
            var parts = currentHost.split(':');

            // Extract the IP address and port number
            var ipAddress = parts[0];
            var currentPort = parts[1];

            // Define the new port number
            var newPort = '8000';

            // Generate the new host value with the same IP but different port
            var newHost = ipAddress + ':' + newPort;

            const ws_path = ws_scheme + '://' + newHost + `/ws/${clientId}?llm_model=${selectedModel}&token=${token}`;
            
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
