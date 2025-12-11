"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  PlayerProfileSummary,
  TeamProfileSummary,
  apiGetMatchingPlayersForMe,
  apiGetMatchingTeamsForMe,
} from "@/lib/api";

export default function DashboardPage() {
  const [teams, setTeams] = useState<TeamProfileSummary[]>([]);
  const [players, setPlayers] = useState<PlayerProfileSummary[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [playersError, setPlayersError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      setTeamsError(null);
      try {
        const res = await apiGetMatchingTeamsForMe();
        setTeams(res);
      } catch (err) {
        console.error("Failed to load matching teams", err);
        if (err instanceof ApiError) {
          setTeamsError(err.message);
        } else {
          setTeamsError("Team-Empfehlungen konnten nicht geladen werden.");
        }
      } finally {
        setLoadingTeams(false);
      }
    };

    const loadPlayers = async () => {
      setLoadingPlayers(true);
      setPlayersError(null);
      try {
        const res = await apiGetMatchingPlayersForMe();
        setPlayers(res);
      } catch (err) {
        console.error("Failed to load matching players", err);
        if (err instanceof ApiError) {
          setPlayersError(err.message);
        } else {
          setPlayersError(
            "Spieler-Empfehlungen konnten nicht geladen werden.",
          );
        }
      } finally {
        setLoadingPlayers(false);
      }
    };

    // beide Aufrufe parallel starten – Fehler jeweils separat anzeigen
    loadTeams();
    loadPlayers();
  }, []);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 py-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">
            Übersicht über dein Profil, passende Teams / Spieler und
            nächste Schritte.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href="/players/me"
            className="rounded-2xl border border-border px-4 py-2 text-xs font-medium text-gray-200 transition hover:border-accent hover:text-accent"
          >
            Mein Spielerprofil
          </Link>
          <span className="text-xs text-gray-500">Nur für Team-Manager:</span>
          <Link
            href="/teams/me"
            className="rounded-2xl bg-accent px-4 py-2 text-xs font-semibold text-black shadow-soft-neon transition hover:bg-accent/80"
          >
            Teamprofil verwalten
          </Link>
        </div>
      </header>

      {/* Matching: Teams für mich (als Spieler) */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Empfohlene Teams für dich
            </h2>
            <p className="text-xs text-gray-400">
              Basierend auf Region &amp; deinen Games. Später kommen Rollen
              &amp; Ranks dazu.
            </p>
          </div>
          <Link
            href="/teams"
            className="rounded-2xl border border-border px-3 py-1 text-xs text-gray-200 transition hover:border-accent hover:text-accent"
          >
            Alle Teams anzeigen
          </Link>
        </div>

        {loadingTeams && (
          <p className="mt-3 text-xs text-gray-400">
            Lade Team-Empfehlungen...
          </p>
        )}

        {teamsError && !loadingTeams && (
          <p className="mt-3 text-xs text-red-400">{teamsError}</p>
        )}

        {!loadingTeams && !teamsError && teams.length === 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Noch keine Team-Empfehlungen gefunden. Lege zuerst dein{" "}
            <Link
              href="/players/me"
              className="text-accent underline-offset-2 hover:underline"
            >
              Spielerprofil
            </Link>{" "}
            mit Region und mindestens einem Game-Profil an.
          </p>
        )}

        {!loadingTeams && teams.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const createdAt = team.createdAt
                ? new Date(team.createdAt).toLocaleDateString()
                : null;

              return (
                <div
                  key={team.id}
                  className="rounded-2xl border border-border bg-surface/60 p-3 text-xs text-gray-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <p className="truncate font-semibold">
                        {team.name}
                        {team.tag ? ` [${team.tag}]` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Region: {team.region ?? "n/a"} • Level: {team.level}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[11px] text-gray-400">
                    {/* Placeholder-Text, da Summary aktuell keine Beschreibung enthält */}
                    Noch keine Beschreibung gesetzt.
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {createdAt ? `Erstellt am ${createdAt}` : "Erstellungsdatum n/a"}
                    </span>
                    <Link
                      href={`/teams/${team.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Teamprofil ansehen
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Matching: Spieler für mein Team */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Empfohlene Spieler für dein Team
            </h2>
            <p className="text-xs text-gray-400">
              Basierend auf Region &amp; euren Games. Später kommen Rollen
              &amp; Ranks dazu.
            </p>
          </div>
          <Link
            href="/players"
            className="rounded-2xl border border-border px-3 py-1 text-xs text-gray-200 transition hover:border-accent hover:text-accent"
          >
            Alle Spieler anzeigen
          </Link>
        </div>

        {loadingPlayers && (
          <p className="mt-3 text-xs text-gray-400">
            Lade Spieler-Empfehlungen...
          </p>
        )}

        {playersError && !loadingPlayers && (
          <p className="mt-3 text-xs text-red-400">{playersError}</p>
        )}

        {!loadingPlayers && !playersError && players.length === 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Noch keine Spieler-Empfehlungen gefunden. Lege zuerst dein{" "}
            <Link
              href="/teams/me"
              className="text-accent underline-offset-2 hover:underline"
            >
              Teamprofil
            </Link>{" "}
            mit Region und mindestens einem Game-Profil an.
          </p>
        )}

        {!loadingPlayers && players.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => {
              const createdAt = player.createdAt
                ? new Date(player.createdAt).toLocaleDateString()
                : null;

              return (
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
                    <span>
                      {createdAt ? `Erstellt am ${createdAt}` : "Erstellungsdatum n/a"}
                    </span>
                    <Link href={`/players/${player.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Spielerprofil ansehen
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
