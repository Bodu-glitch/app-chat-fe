import {io} from 'socket.io-client';

export const socket = io('http://localhost:81/chat', {
    autoConnect: true,
    withCredentials: false,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
});
