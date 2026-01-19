import { io } from 'socket.io-client';

export const socket = io('http://localhost:80', {
    autoConnect: true,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
});
