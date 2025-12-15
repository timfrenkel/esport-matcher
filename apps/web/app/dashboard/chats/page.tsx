"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiGetChats,
  ChatConversationDto,
} from "@/lib/api";

function getMyUserId(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("em_auth");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed.userId === "string" ? parsed.userId : null;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DashboardChatsPage() {
  const [chats, setChats] = useState<ChatConversationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myUserId = useMemo(() => getMyUserId(), []);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const list = await apiGetChats();
      setChats(list ?? []);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Chats konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Chats
        </h1>
        <p className="text-sm text-gray-400">
          Hier findest du alle Chats, die aus angenommenen Kontaktanfragen entstanden sind.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-400">Lade Chats...</div>
      ) : chats.length === 0 ? (
        <div className="text-sm text-gray-400">
          Noch keine Chats vorhanden. (Ein Chat entsteht, sobald eine Anfrage angenommen wird.)
        </div>
      ) : (
        <ul className="space-y-3">
          {chats.map((c) => {
            const cr = c.contactRequest;
            const otherUserId =
              cr && myUserId
                ? cr.fromUserId === myUserId
                  ? cr.toUserId
                  : cr.fromUserId
                : null;

            const otherEmail =
              cr && myUserId
                ? (cr.fromUserId === myUserId ? cr.toUser?.email : cr.fromUser?.email) ?? null
                : null;

            const lastMsg = c.messages && c.messages.length > 0 ? c.messages[0] : null;

            return (
              <li
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-300">
                      {cr?.game?.name ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                          {cr.game.name}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-white font-semibold">
                      {otherEmail ? otherEmail : otherUserId ? `User ${otherUserId}` : "Chat"}
                    </div>

                    <div className="text-xs text-gray-400">
                      Zuletzt aktiv: {formatDate(c.updatedAt)}
                    </div>

                    {lastMsg ? (
                      <div className="mt-2 text-sm text-gray-200 line-clamp-2">
                        {lastMsg.content}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-400">
                        Noch keine Nachrichten.
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/chats/${c.id}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:border-white/25 transition"
                  >
                    Öffnen
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
