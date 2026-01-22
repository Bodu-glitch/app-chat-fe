"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {socket} from "@/utils/socket";
import {useSelector} from "react-redux";
import {RootState} from "@/lib/store";

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

type ServerPayload = string | Message;

type Member = { id: string; name: string };

type MembersMap = Record<string, Member>;

export default function ChatRoomPage() {
    const params = useParams<{ roomId: string }>();
    const router = useRouter();
    const roomId = params?.roomId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [connected, setConnected] = useState(socket.connected);
    const [socketError, setSocketError] = useState<string | null>(null);
    const [members, setMembers] = useState<MembersMap>({});
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // read username from localStorage (will be moved to Redux)
    const username = useSelector((s: RootState) => s.user.name) || '';

    const selfId = (socket.id ?? '') as string;

    const isOwner = useMemo(() => {
        return ownerId !== null && selfId === ownerId;
    }, [ownerId, selfId]);

    useEffect(() => {
        if (!username) {
            router.replace('/name');
            return;
        }
        // If already connected, just join the room
        if (socket.connected && roomId) {
            socket.emit("room:join", {roomId, sender: username});
        }

        function onConnect() {
            setConnected(true);
            setSocketError(null);
            if (roomId) {
                socket.emit("room:join", {roomId, sender: username});
            }
        }

        function onDisconnect(reason: string) {
            setConnected(false);
            console.warn('socket disconnected', reason);
        }

        function onServerMessage(payload: ServerPayload) {
            const data = typeof payload === "string"
                ? {id: 'server', text: payload, sender: "server", timestamp: Date.now()}
                : {
                    id: payload.id ?? 'server',
                    text: payload.text,
                    sender: payload.sender ?? "server",
                    timestamp: payload.timestamp ?? Date.now()
                };

            // Skip echoed message from current user (already optimistically added)
            if (data.sender === username) return;

            setMessages((prev) => [...prev, data]);
        }

        function onRoomJoined(data: { roomId: string, ownerId?: string | null }) {
            console.log('joined room', data.roomId);
            if (data.ownerId) setOwnerId(data.ownerId);
            // add self to members list with name
            setMembers(prev => ({...prev, [selfId]: {id: selfId, name: username}}));
        }

        function onMemberJoined(data: { memberId: string, sender: string }) {
            setMessages(prev => [...prev, {
                id: 'server',
                text: `${data.sender} đã tham gia phòng`,
                sender: 'server',
                timestamp: Date.now()
            }]);
            setMembers(prev => ({...prev, [data.memberId]: {id: data.memberId, name: data.sender}}));
        }

        function onMemberLeft(data: { memberId: string, sender: string }) {
            setMessages(prev => [...prev, {
                id: 'server',
                text: `${data.sender} đã rời phòng`,
                sender: 'server',
                timestamp: Date.now()
            }]);
            setMembers(prev => {
                const map = {...prev};
                delete map[data.memberId];
                return map;
            });
        }

        function onRoomKick(data: { reason: string }) {
            console.warn('kicked from room', data);

            router.push('/');
            window.alert('Bạn đã bị đá khỏi phòng.');
        }

        function onRoomError(err: { message: string }) {
            setSocketError(err.message);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("message", onServerMessage);
        socket.on("room:joined", onRoomJoined);
        socket.on("room:member_joined", onMemberJoined);
        socket.on("room:member_left", onMemberLeft);
        socket.on("room:kick", onRoomKick);
        socket.on("room:error", onRoomError);
        socket.on('exception', (err) => {
            console.error('Socket exception:', err);
            setSocketError(err.message || 'Unknown error');
        })

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("message", onServerMessage);
            socket.off("room:joined", onRoomJoined);
            socket.off("room:member_joined", onMemberJoined);
            socket.off("room:member_left", onMemberLeft);
            socket.off("room:kick", onRoomKick);
            socket.off("room:error", onRoomError);
            if (roomId && username) {
                socket.emit('room:leave', {roomId, sender: username});
            }
        };
    }, [roomId, router, username]);

    function sendMessage() {
        const text = input.trim();
        if (!text || !roomId || !username) return;
        // optimistic
        setMessages((prev) => [...prev, {id: 'server', text, sender: username, timestamp: Date.now()}]);
        socket.emit("message", {roomId, text, sender: username});
        setInput("");
        inputRef.current?.focus();
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    }

    function kickMember(targetId: string) {
        if (!roomId) return;
        socket.emit('room:kick_member', {roomId, targetSocketId: targetId});
    }

    const membersList = Object.values(members);

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
            <header
                className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">← Trang
                        chủ</Link>
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Phòng chat</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className={`rounded-full px-3 py-1 text-xs ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{connected ? "Đã kết nối" : "Mất kết nối"}</span>
                    {roomId && (<span className="text-xs text-zinc-600 dark:text-zinc-300">Mã phòng: {roomId}</span>)}
                    {socketError && (<span className="text-xs text-red-600">Lỗi socket: {socketError}</span>)}
                </div>
            </header>
            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-4">
                {
                    isOwner &&
                    <>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">Thành viên
                                ({membersList.length})
                            </div>
                            <div className="text-xs text-zinc-500">Bạn là chủ phòng</div>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {membersList.map(m => (
                                <div key={m.id}
                                     className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-800">
                                    <span>{m.name}{m.id === ownerId ? ' (owner)' : ''}{m.id === selfId ? ' (bạn)' : ''}</span>
                                    {/*{isOwner && m.id !== selfId && (*/}
                                    <button onClick={() => kickMember(m.id)}
                                            className="rounded bg-red-600 px-2 py-0.5 text-white">Kick
                                    </button>
                                    {/*)}*/}
                                </div>
                            ))}
                        </div>
                    </>
                }


                <div
                    className="h-[50vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Chưa có tin nhắn nào.</p>
                    ) : (
                        <ul className="space-y-3">
                            {messages.map((m) => (
                                <li key={m.id}
                                    className={`flex ${m.sender === username ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                                            m.sender === username
                                                ? "bg-black text-white dark:bg-zinc-100 dark:text-black"
                                                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                                        }`}>

                                        <p className={`mb-1 block text-xs font-bold ${
                                            m.sender === username
                                                ? "text-zinc-400 dark:text-zinc-500" // Màu tên khi là chính mình (trên nền tối)
                                                : "text-zinc-600 dark:text-zinc-400" // Màu tên khi là người khác
                                        }`}>
                                            {m.sender}
                                        </p>

                                        <p>{m.text}</p>

                                        <span className={`mt-1 block text-[10px] ${
                                            m.sender === username ? "opacity-60" : "opacity-50"
                                        }`}>{new Date(m.timestamp).toLocaleTimeString()}    </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                           onKeyDown={onKeyDown} placeholder="Nhập tin nhắn..."
                           className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"/>
                    <button onClick={sendMessage}
                            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                            disabled={!connected}>Gửi
                    </button>
                </div>
            </main>
        </div>
    );
}
