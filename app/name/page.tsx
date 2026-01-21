"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setName } from "@/lib/userSlice";

export default function NamePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentName = useSelector((s: RootState) => s.user.name);
  const [name, setLocalName] = useState("");

  useEffect(() => {
    if (currentName) {
      setLocalName(currentName);
    }
  }, [currentName]);

  function save() {
    const n = name.trim();
    if (!n) return;
    dispatch(setName(n));
    router.push('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Đặt tên của bạn</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Tên này sẽ được dùng để gửi tin nhắn.</p>
        <div className="mt-4 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Nhập tên..."
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={save}
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            disabled={!name.trim()}
          >
            Lưu
          </button>
        </div>
      </main>
    </div>
  );
}
