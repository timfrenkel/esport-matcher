"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiGetIncomingContactRequests,
  apiGetOutgoingContactRequests,
  apiUpdateContactRequestStatus,
  ContactRequestStatus,
} from "@/lib/api";

type ContactRequestView = {
  id: string;
  status: ContactRequestStatus;
  createdAt: string;

  otherProfileId: string | null;
  otherType: "PLAYER" | "TEAM" | null;
  otherDisplayName: string | null;

  // optional, je nachdem was backend liefert
  game?: { name: string } | null;
  message: string | null;

  // optional für später (pro Spiel)
  gameId?: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function profileHref(r: ContactRequestView) {
  if (!r.otherProfileId || !r.otherType) return null;
  return r.otherType === "PLAYER"
    ? `/players/${r.otherProfileId}`
    : `/teams/${r.otherProfileId}`;
}

export default function DashboardRequestsPage() {
  const [tab, setTab] = useState<"INBOX" | "OUTBOX">("INBOX");
  const [incoming, setIncoming] = useState<ContactRequestView[]>([]);
  const [outgoing, setOutgoing] = useState<ContactRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      const [inc, out] = await Promise.all([
        apiGetIncomingContactRequests(),
        apiGetOutgoingContactRequests(),
      ]);

      setIncoming(inc as any);
      setOutgoing(out as any);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Anfragen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const list = useMemo(
    () => (tab === "INBOX" ? incoming : outgoing),
    [tab, incoming, outgoing],
  );

  async function setStatus(id: string, status: ContactRequestStatus) {
    setActionBusyId(id);
    setError(null);

    try {
      await apiUpdateContactRequestStatus(id, status);
      await reload();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Status konnte nicht geändert werden.");
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Kontaktanfragen
        </h1>
        <p className="text-sm text-gray-400">
          Hier siehst du Schnellanfragen von Teams/Spielern und kannst sie annehmen oder ablehnen.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("INBOX")}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
            tab === "INBOX"
              ? "border-[#00eaff] text-[#00eaff] shadow-[0_0_12px_rgba(0,234,255,0.35)]"
              : "border-white/15 text-gray-300 hover:text-white"
          }`}
        >
          Eingang
        </button>
        <button
          type="button"
          onClick={() => setTab("OUTBOX")}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
            tab === "OUTBOX"
              ? "border-[#00eaff] text-[#00eaff] shadow-[0_0_12px_rgba(0,234,255,0.35)]"
              : "border-white/15 text-gray-300 hover:text-white"
          }`}
        >
          Gesendet
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-400">Lade Anfragen...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400">Keine Anfragen vorhanden.</div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const href = profileHref(r);
            const busy = actionBusyId === r.id;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-surface/60 p-4 text-sm text-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {r.otherDisplayName ?? "Unbekannt"}
                      </span>
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-300">
                        {r.status}
                      </span>
                      {r.game?.name ? (
                        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-300">
                          {r.game.name}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-[11px] text-gray-400">
                      {formatDate(r.createdAt)}
                    </div>

                    {r.message ? (
                      <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-gray-200">
                        {r.message}
                      </div>
                    ) : null}

                    {href ? (
                      <Link
                        href={href}
                        className="inline-block pt-2 text-xs text-[#00eaff] hover:underline underline-offset-2"
                      >
                        Profil ansehen
                      </Link>
                    ) : null}
                  </div>

                  {/* Aktionen: nur im Eingang und nur bei PENDING */}
                  {tab === "INBOX" && r.status === "PENDING" ? (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(r.id, "ACCEPTED")}
                        className="rounded-full bg-[#00eaff] px-4 py-2 text-xs font-semibold text-black shadow-[0_0_10px_#00eaff] hover:shadow-[0_0_18px_#00eaff] transition disabled:opacity-50"
                      >
                        Annehmen
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(r.id, "REJECTED")}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-gray-200 hover:border-red-400/60 hover:text-red-200 transition disabled:opacity-50"
                      >
                        Ablehnen
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
