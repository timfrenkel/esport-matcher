"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  apiCreateContactRequestForPlayer,
  apiCreateContactRequestForTeam,
  apiGetOutgoingContactRequests,
  apiWithdrawContactRequest,
} from "@/lib/api";

type TargetType = "PLAYER" | "TEAM";
type UiState = "IDLE" | "SENDING" | "PENDING" | "ACCEPTED" | "REJECTED" | "ERROR";
type UserRole = "PLAYER" | "TEAM" | null;

type OutgoingItem = any;

function readRoleFromLocalStorage(): UserRole {
  try {
    const raw = localStorage.getItem("em_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string } | null;
    const role = parsed?.role;
    return role === "PLAYER" || role === "TEAM" ? role : null;
  } catch {
    return null;
  }
}

export default function QuickContactRequestButton(props: {
  targetType: TargetType;
  targetId: string;

  // ✅ pro Spiel eindeutig
  gameId: string;

  gameName: string;
  roleName?: string | null;
  level?: string | null;
  rank?: string | null;

  className?: string;
}) {
  const { targetType, targetId, gameId, gameName, roleName, level, rank, className } =
    props;

  const [myRole, setMyRole] = useState<UserRole>(null);

  const [ui, setUi] = useState<UiState>("IDLE");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // ✅ Rolle nur clientseitig lesen
  useEffect(() => {
    setMyRole(readRoleFromLocalStorage());
  }, []);

  // ✅ blockieren, aber NICHT vor Hooks returnen
  const isBlocked = myRole !== null && myRole === targetType;

  // Status beim Laden aus "Outgoing" ableiten (pro Spiel!)
  useEffect(() => {
    if (isBlocked) return;

    let alive = true;

    (async () => {
      try {
        const outgoing = (await apiGetOutgoingContactRequests()) as OutgoingItem[];

        const hit = outgoing.find((r: any) => {
          const rGameId = r.gameId ?? r.game?.id ?? null;
          const rTargetProfileId =
            r.target?.profileId ?? r.targetProfileId ?? r.targetId ?? null;

          return rGameId === gameId && rTargetProfileId === targetId;
        });

        if (!alive) return;

        if (!hit) {
          setUi("IDLE");
          setRequestId(null);
          return;
        }

        setRequestId(hit.id ?? null);

        const st = (hit.status ?? "").toString().toUpperCase();
        if (st === "PENDING") setUi("PENDING");
        else if (st === "ACCEPTED") setUi("ACCEPTED");
        else if (st === "REJECTED" || st === "DECLINED") setUi("REJECTED");
        else setUi("IDLE");
      } catch {
        // wenn outgoing nicht lädt: Button bleibt nutzbar
      }
    })();

    return () => {
      alive = false;
    };
  }, [gameId, targetId, isBlocked]);

  function buildMessage() {
    const parts: string[] = [];
    parts.push("Schnellanfrage");
    parts.push(`Game: ${gameName}`);
    if (roleName && roleName.trim()) parts.push(`Rolle: ${roleName}`);
    if (level && level.trim()) parts.push(`Level: ${level}`);
    if (rank && rank.trim()) parts.push(`Rank: ${rank}`);

    if (typeof window !== "undefined") {
      parts.push(`Profil: ${window.location.href}`);
    }

    return parts.join(" | ");
  }

  async function send() {
    if (isBlocked) return;

    if (
      ui === "SENDING" ||
      ui === "PENDING" ||
      ui === "ACCEPTED" ||
      ui === "REJECTED"
    )
      return;

    setUi("SENDING");
    setErrMsg(null);

    try {
      const message = buildMessage();

      if (targetType === "PLAYER") {
        const created = await apiCreateContactRequestForPlayer(targetId, gameId, message);
        setRequestId((created as any)?.id ?? null);
      } else {
        const created = await apiCreateContactRequestForTeam(targetId, gameId, message);
        setRequestId((created as any)?.id ?? null);
      }

      setUi("PENDING");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Anfrage konnte nicht gesendet werden.";
      setErrMsg(msg);
      setUi("ERROR");
    }
  }

  async function withdraw() {
    if (isBlocked) return;
    if (!requestId) return;

    setErrMsg(null);

    try {
      await apiWithdrawContactRequest(requestId);
      setRequestId(null);
      setUi("IDLE");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Anfrage konnte nicht zurückgezogen werden.";
      setErrMsg(msg);
      setUi("ERROR");
    }
  }

  const label = useMemo(() => {
    if (ui === "SENDING") return "Sende...";
    if (ui === "PENDING") return "Anfrage gesendet";
    if (ui === "ACCEPTED") return "Angenommen ✓";
    if (ui === "REJECTED") return "Abgelehnt";
    if (ui === "ERROR") return "Fehler";
    return "Schnellanfrage";
  }, [ui]);

  const disabled =
    isBlocked ||
    ui === "SENDING" ||
    ui === "PENDING" ||
    ui === "ACCEPTED" ||
    ui === "REJECTED";

  // ✅ erst ganz am Ende returnen
  if (isBlocked) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={send}
        disabled={disabled}
        className={
          className ??
          "rounded-full border border-[#00eaff] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00eaff] shadow-[0_0_12px_rgba(0,234,255,0.3)] transition hover:shadow-[0_0_20px_rgba(0,234,255,0.7)] disabled:opacity-50"
        }
      >
        {label}
      </button>

      {ui === "PENDING" ? (
        <button
          type="button"
          onClick={withdraw}
          className="text-[10px] text-gray-400 hover:text-white underline-offset-2 hover:underline"
        >
          Abbrechen
        </button>
      ) : null}

      <span className="text-[10px] text-gray-400" aria-live="polite">
        {ui === "ERROR" ? errMsg : ""}
      </span>
    </div>
  );
}
