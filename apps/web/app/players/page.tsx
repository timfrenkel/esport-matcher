"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  apiGetGames,
  apiGetGameRoles,
  apiSearchPlayers,
  GameDto,
  GameRoleDto,
  PaginatedResult,
  PlayerProfileSummary,
} from "@/lib/api";
import { GAME_REGIONS } from "@/lib/constants";

// Sprachen-Auswahl für Filter (wird nur als Filterstring genutzt)
const LANGUAGE_OPTIONS = [
  { value: "", label: "Alle Sprachen" },
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Französisch" },
  { value: "es", label: "Spanisch" },
  { value: "pl", label: "Polnisch" },
  { value: "tr", label: "Türkisch" },
];

// Rank/Elo Filter – game-spezifisch
type RankFilterOption = { value: string; label: string };

const GENERIC_RANK_FILTER_OPTIONS: RankFilterOption[] = [
  { value: "", label: "Alle Ranks" },
  { value: "Iron", label: "Iron" },
  { value: "Bronze", label: "Bronze" },
  { value: "Silver", label: "Silver" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Diamond", label: "Diamond" },
  { value: "Master", label: "Master" },
  { value: "Grandmaster", label: "Grandmaster" },
  { value: "Challenger", label: "Challenger" },
];

const GAME_RANK_FILTER_OPTIONS_BY_NAME: Record<
  string,
  RankFilterOption[]
> = {
  "League of Legends": [
    { value: "", label: "Alle Ranks" },
    { value: "Iron", label: "Iron" },
    { value: "Bronze", label: "Bronze" },
    { value: "Silver", label: "Silver" },
    { value: "Gold", label: "Gold" },
    { value: "Platinum", label: "Platinum" },
    { value: "Emerald", label: "Emerald" },
    { value: "Diamond", label: "Diamond" },
    { value: "Master", label: "Master" },
    { value: "Grandmaster", label: "Grandmaster" },
    { value: "Challenger", label: "Challenger" },
  ],
  VALORANT: [
    { value: "", label: "Alle Ranks" },
    { value: "Iron", label: "Iron" },
    { value: "Bronze", label: "Bronze" },
    { value: "Silver", label: "Silver" },
    { value: "Gold", label: "Gold" },
    { value: "Platinum", label: "Platinum" },
    { value: "Diamond", label: "Diamond" },
    { value: "Ascendant", label: "Ascendant" },
    { value: "Immortal", label: "Immortal" },
    { value: "Radiant", label: "Radiant" },
  ],
  "Counter-Strike 2": [
    { value: "", label: "Alle Ranks" },
    { value: "Silver", label: "Silver" },
    { value: "Gold Nova", label: "Gold Nova" },
    { value: "Master Guardian", label: "Master Guardian" },
    { value: "Legendary Eagle", label: "Legendary Eagle" },
    { value: "Supreme", label: "Supreme" },
    { value: "Global Elite", label: "Global Elite" },
  ],
};

function getRankFilterOptionsForGame(
  game: GameDto | undefined,
): RankFilterOption[] {
  if (!game) return GENERIC_RANK_FILTER_OPTIONS;
  return (
    GAME_RANK_FILTER_OPTIONS_BY_NAME[game.name] ||
    GENERIC_RANK_FILTER_OPTIONS
  );
}

export default function PlayersPage() {
  const [games, setGames] = useState<GameDto[]>([]);
  const [rolesByGame, setRolesByGame] = useState<
    Record<string, GameRoleDto[]>
  >({});

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>("");

  const [q, setQ] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [data, setData] =
    useState<PaginatedResult<PlayerProfileSummary> | null>(null);
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

  // Rollen für ein Spiel lazy laden
  async function ensureRolesLoaded(gameId: string) {
    if (!gameId) return;
    if (rolesByGame[gameId]) return;

    try {
      const roles = await apiGetGameRoles(gameId);
      setRolesByGame((prev) => ({ ...prev, [gameId]: roles }));
    } catch (err) {
      console.error("Failed to load roles for game", gameId, err);
    }
  }

  async function loadPlayers(opts?: { resetPage?: boolean }) {
    setLoading(true);
    setError(null);

    try {
      const currentPage = opts?.resetPage ? 1 : page;

      const res = await apiSearchPlayers({
        page: currentPage,
        pageSize,
        gameId: selectedGameId || undefined,
        roleId: selectedRoleId || undefined,
        region: selectedRegion || undefined,
        language: selectedLanguage || undefined,
        rank: selectedRankFilter || undefined,
        q: q || undefined,
      });

      setPage(res.page);
      setData(res);
    } catch (err) {
      console.error("Failed to search players", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Spieler konnten nicht geladen werden.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Initial
  useEffect(() => {
    loadGames();
    loadPlayers({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rollen + Rank-Filter zurücksetzen, wenn Spiel wechselt
  useEffect(() => {
    if (selectedGameId) {
      ensureRolesLoaded(selectedGameId);
      setSelectedRoleId("");
      setSelectedRankFilter("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameId]);

  const totalPages =
    data && data.pageSize > 0
      ? Math.max(1, Math.ceil(data.total / data.pageSize))
      : 1;

  const handleApplyFilters = () => {
    loadPlayers({ resetPage: true });
  };

  const handleResetFilters = () => {
    setSelectedGameId("");
    setSelectedRoleId("");
    setSelectedRegion("");
    setSelectedLanguage("");
    setSelectedRankFilter("");
    setQ("");
    setPage(1);
    loadPlayers({ resetPage: true });
  };

  const handlePrevPage = () => {
    if (!data) return;
    if (page <= 1) return;
    const newPage = page - 1;
    setPage(newPage);
    loadPlayers();
  };

  const handleNextPage = () => {
    if (!data) return;
    if (page >= totalPages) return;
    const newPage = page + 1;
    setPage(newPage);
    loadPlayers();
  };

  const currentRoles =
    (selectedGameId && rolesByGame[selectedGameId]) || [];

  const selectedGame = games.find((g) => g.id === selectedGameId);
  const rankFilterOptions = getRankFilterOptionsForGame(selectedGame);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Spieler entdecken
        </h1>
        <p className="max-w-2xl text-sm text-gray-400">
          Finde Spieler nach Spiel, Rolle, Region, Sprache und Rank/Elo. Diese
          Filter sind die Grundlage für euer späteres Matching-System.
        </p>
      </header>

      {/* Filter-Card */}
      <section className="rounded-2xl border border-border/70 bg-surface/80 p-5 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Filter &amp; Suche
            </h2>
            <p className="text-[11px] text-gray-400">
              Kombiniere Spiel, Rolle, Region &amp; Rank, um passende Spieler
              zu finden.
            </p>
          </div>
          <div className="hidden text-[11px] text-gray-500 md:block">
            Alle Werte sind vorgegeben – keine Verwirrung mehr zwischen
            &quot;EUW&quot; und &quot;EU West&quot;.
          </div>
        </div>

        {/* erste Zeile */}
        <div className="grid gap-4 md:grid-cols-4 md:items-end">
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

          {/* Rolle */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Rolle
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={!selectedGameId}
            >
              <option value="">
                {selectedGameId ? "Alle Rollen" : "Spiel zuerst wählen"}
              </option>
              {currentRoles.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rank/Elo */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Rank/Elo
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedRankFilter}
              onChange={(e) => setSelectedRankFilter(e.target.value)}
              disabled={!selectedGameId}
            >
              <option value="">
                {selectedGameId
                  ? "Alle Ranks"
                  : "Erst Spiel auswählen"}
              </option>
              {selectedGameId &&
                rankFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Region
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">Alle Regionen</option>
              {GAME_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* zweite Zeile */}
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_auto] md:items-end">
          {/* Textsuche */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Suche (Name)
            </label>
            <input
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              placeholder="z.B. 'midlane', 'IGL', 'tim'"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Sprache */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-gray-400">
              Sprache
            </label>
            <select
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
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
        </div>
      </section>

      {/* Status */}
      {error && (
        <div className="rounded-xl border border-red-500/70 bg-red-950/40 px-4 py-3 text-xs text-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-300">Lade Spieler.</div>
      )}

      {/* Ergebnisliste */}
      {!loading && data && data.items.length === 0 && (
        <div className="text-sm text-gray-400">
          Keine Spieler gefunden. Passe Filter oder Suchbegriff an.
        </div>
      )}

      {!loading && data && data.items.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Gefundene Spieler:{" "}
              <span className="font-semibold text-gray-200">
                {data.total}
              </span>
            </span>
            <span>
              Seite {page} von {totalPages}
            </span>
          </div>

          <div className="space-y-3">
            {data.items.map((player) => (
              <article
                key={player.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-black/50 px-4 py-3"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">
                    {player.displayName || "Unbenannter Spieler"}
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px] text-gray-400">
                    {player.region && (
                      <span className="rounded-full border border-border/60 px-2 py-[1px]">
                        Region: {player.region}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500">
                    ID: {player.id} · Spieleinträge:{" "}
                    {player.gameProfiles?.length ?? 0}
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400">
                  Detailprofil &amp; Matching folgen später.
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Pagination */}
      {!loading && data && data.items.length > 0 && (
        <footer className="flex items-center justify-between pt-2 text-xs text-gray-400">
          <div>
            Seite {page} von {totalPages} · {data.total} Spieler
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
