"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ApiError,
  apiGetChatMessages,
  apiSendChatMessage,
  ChatMessageDto,
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

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;

  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const myUserId = useMemo(() => getMyUserId(), []);

  async function reload() {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await apiGetChatMessages(conversationId);
      setMessages(list ?? []);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Nachrichten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // später (Realtime) ersetzen wir das hier; jetzt bewusst simpel/stabil
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  async function send() {
    if (!conversationId) return;
    const text = content.trim();
    if (!text) return;

    setSending(true);
    setError(null);

    try {
      await apiSendChatMessage(conversationId, text);
      setContent("");
      await reload();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Chat
          </h1>
          <p className="text-sm text-gray-400">
            <Link href="/dashboard/chats" className="hover:text-white underline underline-offset-2">
              ← zurück zur Chat-Liste
            </Link>
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <div className="text-sm text-gray-400">Lade Nachrichten...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-gray-400">Noch keine Nachrichten.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const mine = myUserId ? m.senderId === myUserId : false;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-white/15 text-white border border-white/10"
                        : "bg-black/30 text-gray-100 border border-white/10"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      <div className="flex gap-2">
        <input ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nachricht schreiben…"
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !content.trim()}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200 hover:text-white hover:border-white/25 disabled:opacity-50 transition"
        >
          Senden
        </button>
      </div>
    </div>
  );
}
