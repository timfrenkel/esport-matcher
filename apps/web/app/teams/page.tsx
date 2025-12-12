"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiGetGames,
  apiSearchTeams,
  apiGetGameRoles,
  GameDto,
  PaginatedResult,
  TeamListItem,
} from "@/lib/api";
import { REGION_OPTIONS } from "@/lib/regions";
import { TEAM_LEVEL_OPTIONS } from "@/lib/teamlevels";

// einfache Helper-Typen, falls apiGetGameRoles noch nicht explizit typisiert ist
interface GameRoleDto {
  id: string;
  name: string;
  code?: string;
}

const LEVEL_OPTIONS = [
  { value: "", label: "Alle Level" },
  { value: "SEMI", label: "Semi-Competitive" },
  { value: "PRO", label: "Pro / E-Sport" },
  { value: "ACADEMY", label: "Academy / Nachwuchs" },
];

export default function TeamsPage() {
  const [games, setGames] = useState<GameDto[]>([]);
  const [roles, setRoles] = useState<GameRoleDto[]>([]);

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [data, setData] = useState<PaginatedResult<TeamListItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGames() {
    try {
      const list = await apiGetGames();
      setGames(list);
    } catch (err) {
      console.error("Failed to load games", err);
    }
  }

  async function loadRolesForGame(gameId: string) {
    if (!gameId) {
      setRoles([]);
      setSelectedRoleId("");
      return;
    }

    try {
      const res = await apiGetGameRoles(gameId);
      setRoles(res as GameRoleDto[]);
    } catch (err) {
      console.error("Failed to load roles for game", err);
      setRoles([]);
      setSelectedRoleId("");
    }
  }

  async function loadTeams(opts?: { resetPage?: boolean }) {
    setLoading(true);
    setError(null);

    try {
      const currentPage = opts?.resetPage ? 1 : page;
      const res = await apiSearchTeams({
        page: currentPage,
        pageSize,
        gameId: selectedGameId || undefined,
        roleId: selectedRoleId || undefined,
        region: region || undefined,
        level: level || undefined,
        q: q || undefined,
      });

      setPage(res.page);
      setData(res);
    } catch (err) {
      console.error("Failed to search teams", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Teams konnten nicht geladen werden.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
    loadTeams({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wenn Spiel wechselt → Rollen nachladen
  useEffect(() => {
    loadRolesForGame(selectedGameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameId]);

  const totalPages =
    data && data.pageSize > 0
      ? Math.max(1, Math.ceil(data.total / data.pageSize))
      : 1;

  const handleApplyFilters = () => {
    loadTeams({ resetPage: true });
  };

  const handleResetFilters = () => {
    setSelectedGameId("");
    setSelectedRoleId("");
    setRegion("");
    setLevel("");
    setQ("");
    setPage(1);
    loadTeams({ resetPage: true });
  };

  const handlePrevPage = () => {
    if (!data) return;
    if (page <= 1) return;
    const newPage = page - 1;
    setPage(newPage);
    loadTeams();
  };

  const handleNextPage = () => {
    if (!data) return;
    if (page >= totalPages) return;
    const newPage = page + 1;
    setPage(newPage);
    loadTeams();
  };

  return (
    <div className="space-y-8">
      {/* Header – analog zur Players-Seite */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Teams entdecken
        </h1>
        <p className="max-w-2xl text-sm text-gray-400">
          Finde Semi-Competitive Teams und E-Sport-Organisationen, gefiltert
          nach Spiel, offenen Rollen, Region und Level. Diese Liste ist die
          Basis für das spätere Team-Spieler-Matching.
        </p>
      </header>

      {/* Filter-Card – 1:1 Stil wie Players, aber mit Team-spezifischen Feldern */}
      <section className="rounded-2xl border border-border/70 bg-surface/80 p-5 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Filter &amp; Suche
            </h2>
            <p className="text-[11px] text-gray-400">
              Kombiniere Spiel, offene Rolle, Region und Team-Level, um passende
              Teams zu finden.
            </p>
          </div>
          <div className="hidden text-[11px] text-gray-500 md:block">
            Offene Rollen &amp; Ranks stammen aus den Teamprofilen – je besser
            gepflegt, desto präziser das Matching.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,200px)_minmax(0,200px)_minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)] md:items-end">
          {/* Spiel */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Spiel
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              <option value="">Alle Spiele</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Offene Rolle (abhängig von Spiel) */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Offene Rolle
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={!selectedGameId || roles.length === 0}
            >
              <option value="">Alle Rollen</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Server / Region
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Alle Regionen</option>
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team-Level */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Team-Level
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Alle Level</option>
              {TEAM_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          
          {/* Textsuche */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Suche (Name oder Tag)
            </label>
            <input
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              placeholder='z.B. "Academy", "Scrim Team", "[TAG]"'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons unten rechts wie bei Players */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-full bg-[#00eaff] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-black shadow-[0_0_12px_#00eaff] transition hover:shadow-[0_0_20px_#00eaff]"
          >
            Filter anwenden
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full border border-border px-5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-200 transition hover:border-[#00eaff] hover:text-[#00eaff]"
          >
            Zurücksetzen
          </button>
        </div>
      </section>

      {/* Fehler / Status */}
      {error && (
        <div className="rounded-xl border border-red-500/70 bg-red-950/40 px-4 py-3 text-xs text-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-300">Lade Teams...</div>
      )}

      {/* Keine Ergebnisse */}
      {!loading && data && data.items.length === 0 && (
        <div className="text-sm text-gray-400">
          Keine Teams gefunden. Passe Filter oder Suchbegriff an.
        </div>
      )}

      {/* Ergebnisliste */}
      {!loading && data && data.items.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Gefundene Teams:{" "}
              <span className="font-semibold text-gray-200">
                {data.total}
              </span>
            </span>
            <span>
              Seite {page} von {totalPages}
            </span>
          </div>

          <div className="space-y-3">
            {data.items.map((team) => {
              const mainRegion = team.region ?? "nicht angegeben";
              const mainLevel = team.level ?? "nicht gesetzt";

              const gameEntriesCount =
              (team as any).teamGameProfiles?.length ??
              (team as any).gameProfiles?.length ??
              0;

              return (
                <article
                  key={team.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-black/50 px-4 py-4 md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-white">
                      {team.name}
                      {team.tag ? (
                        <span className="ml-2 text-xs text-[#00eaff]">
                          [{team.tag}]
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-gray-400">
                      Region:{" "}
                      <span className="font-medium text-gray-200">
                        {mainRegion}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Level:{" "}
                      <span className="font-medium text-gray-200">
                        {mainLevel}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500">
                    Spiele-Einträge:{" "}
                    {gameEntriesCount}
                    </div>
                  </div>

                  <div className="space-y-2 text-right text-[11px] text-gray-400">
                    <div>
                      <span className="block text-xs font-semibold text-gray-200">
                        Nächste Schritte
                      </span>
                      <span className="block">
                        Öffne das Teamprofil, um Spiele, Rollen &amp; Level
                        zu sehen.
                      </span>
                    </div>
                    <Link
                      href={`/teams/${team.id}`}
                      className="inline-flex items-center justify-center rounded-full border border-[#00eaff] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#00eaff] shadow-[0_0_12px_rgba(0,234,255,0.3)] transition hover:shadow-[0_0_20px_rgba(0,234,255,0.7)]"
                    >
                      Teamprofil ansehen
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Pagination */}
      {!loading && data && data.items.length > 0 && (
        <footer className="flex items-center justify-between pt-2 text-xs text-gray-400">
          <div>
            Seite {page} von {totalPages} · {data.total} Teams
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="rounded-full border border-border px-3 py-1 disabled:opacity-40 hover:border-[#00eaff] hover:text-[#00eaff] transition"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="rounded-full border border-border px-3 py-1 disabled:opacity-40 hover:border-[#00eaff] hover:text-[#00eaff] transition"
            >
              Weiter
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
