"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { socket } from "@/utils/socket";

export default function Home() {
  const router = useRouter();
  const [createLoading, setCreateLoading] = useState(false);
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    function onRoomCreated(data: { roomId: string }) {
      setCreateLoading(false);
      router.push(`/chat/${data.roomId}`);
    }
    socket.on("room:created", onRoomCreated);
    return () => {
      socket.off("room:created", onRoomCreated);
    };
  }, [router]);

  function createRoom() {
    setCreateLoading(true);
    socket.emit("room:create");
  }

  function joinRoom() {
    const id = joinId.trim();
    if (!id) return;
    router.push(`/chat/${id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          App Chat
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tạo phòng chat hoặc gia nhập bằng mã phòng.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={createRoom}
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            disabled={createLoading}
          >
            {createLoading ? "Đang tạo..." : "Tạo phòng"}
          </button>
          <div className="flex items-center gap-2">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Nhập mã phòng..."
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              onClick={joinRoom}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              Gia nhập
            </button>
          </div>
          <Link
            href="/chat"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-300"
          >
            Vào phòng chat (cũ)
          </Link>
        </div>
      </main>
    </div>
  );
}
