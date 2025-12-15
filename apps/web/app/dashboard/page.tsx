"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiGetMatchingPlayersForMe,
  apiGetMatchingTeamsForMe,
  PlayerProfileSummary,
  TeamProfileSummary,
} from "../../lib/api";

type UserRole = "PLAYER" | "TEAM" | null;

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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>(null);

  const [teams, setTeams] = useState<TeamProfileSummary[]>([]);
  const [players, setPlayers] = useState<PlayerProfileSummary[]>([]);

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [errorTeams, setErrorTeams] = useState<string | null>(null);
  const [errorPlayers, setErrorPlayers] = useState<string | null>(null);

  // ✅ verhindert Hydration-Mismatch: erst nach Mount localStorage lesen
  useEffect(() => {
    setMounted(true);
    setRole(readRoleFromLocalStorage());
  }, []);

  // ✅ nur relevante Calls laden
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    async function loadTeams() {
      setLoadingTeams(true);
      setErrorTeams(null);
      try {
        const data = await apiGetMatchingTeamsForMe();
        if (!cancelled) setTeams(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErrorTeams(e?.message ?? "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    }

    async function loadPlayers() {
      setLoadingPlayers(true);
      setErrorPlayers(null);
      try {
        const data = await apiGetMatchingPlayersForMe();
        if (!cancelled) setPlayers(data ?? []);
      } catch (e: any) {
        if (!cancelled) setErrorPlayers(e?.message ?? "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoadingPlayers(false);
      }
    }

    if (role === "PLAYER") {
      loadTeams();
      setPlayers([]);
      setErrorPlayers(null);
      setLoadingPlayers(false);
    }

    if (role === "TEAM") {
      loadPlayers();
      setTeams([]);
      setErrorTeams(null);
      setLoadingTeams(false);
    }

    return () => {
      cancelled = true;
    };
  }, [mounted, role]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>

        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/dashboard/requests"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
          >
            Anfragen
          </Link>

          {/* ✅ Links auf existierende /me Seiten */}
          {mounted && role === "PLAYER" ? (
            <Link
              href="/players/me"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            >
              Spielerprofil verwalten
            </Link>
          ) : null}

          {mounted && role === "TEAM" ? (
            <Link
              href="/teams/me"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
            >
              Teamprofil verwalten
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spieler: sieht nur Teams */}
        {mounted && role === "PLAYER" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">
              Empfohlene Teams für dich
            </h2>

            {loadingTeams && (
              <p className="mt-3 text-sm text-gray-300">Lade Teams...</p>
            )}

            {!loadingTeams && errorTeams && (
              <p className="mt-3 text-sm text-red-300">{errorTeams}</p>
            )}

            {!loadingTeams && !errorTeams && teams.length === 0 && (
              <p className="mt-3 text-sm text-gray-300">
                Noch keine passenden Team-Vorschläge.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border border-border bg-surface/60 p-3 text-xs text-gray-200"
                >
                  <p className="truncate font-semibold">
                    {team.name}
                    {team.tag ? ` [${team.tag}]` : ""}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Region: {team.region ?? "n/a"} • Level: {team.level}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      Spiele-Einträge:{" "}
                      {Array.isArray((team as any).gameProfiles)
                        ? (team as any).gameProfiles.length
                        : 0}
                    </span>
                    <Link
                      href={`/teams/${team.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Teamprofil ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team: sieht nur Spieler */}
        {mounted && role === "TEAM" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">
              Empfohlene Spieler für dein Team
            </h2>

            {loadingPlayers && (
              <p className="mt-3 text-sm text-gray-300">Lade Spieler...</p>
            )}

            {!loadingPlayers && errorPlayers && (
              <p className="mt-3 text-sm text-red-300">{errorPlayers}</p>
            )}

            {!loadingPlayers && !errorPlayers && players.length === 0 && (
              <p className="mt-3 text-sm text-gray-300">
                Noch keine passenden Spieler-Vorschläge.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-2xl border border-border bg-surface/60 p-3 text-xs text-gray-200"
                >
                  <p className="truncate font-semibold">
                    {player.displayName ?? "Unbenannter Spieler"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Region: {player.region ?? "n/a"} •{" "}
                    {player.isPro ? "Pro/E-Sport" : "Semi-Competitive"}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span />
                    <Link
                      href={`/players/${player.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Spielerprofil ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fallback */}
        {mounted && !role && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Dashboard</h2>
            <p className="mt-3 text-sm text-gray-300">
              Rolle konnte nicht erkannt werden. Bitte neu einloggen.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
