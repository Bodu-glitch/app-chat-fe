import {io} from 'socket.io-client';

export const socket = io('http://localhost:80/chat', {
    autoConnect: true,
    withCredentials: false,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
});
