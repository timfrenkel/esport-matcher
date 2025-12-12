"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiGetGames,
  apiGetGameRoles,
  apiGetGameRanks,
  apiSearchPlayers,
  GameDto,
  GameRoleDto,
  GameRankDto,
  PaginatedResult,
  PlayerProfileSummary,
} from "@/lib/api";
import { GAME_REGIONS } from "@/lib/constants";

// Sprachen-Auswahl für Filter
const LANGUAGE_OPTIONS = [
  { value: "", label: "Alle Sprachen" },
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Französisch" },
  { value: "es", label: "Spanisch" },
  { value: "pl", label: "Polnisch" },
  { value: "tr", label: "Türkisch" },
];

type RankOption = { value: string; label: string };

export default function PlayersPage() {
  const [games, setGames] = useState<GameDto[]>([]);
  const [rolesByGame, setRolesByGame] = useState<Record<string, GameRoleDto[]>>(
    {},
  );

  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>("");

  const [rankOptions, setRankOptions] = useState<RankOption[]>([]);

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

  // 🔥 Ranks für ein Spiel laden – wichtig: wir benutzen den Game-Code (z.B. "LOL"),
  // weil dein Endpoint /api/games/LOL/ranks den Code erwartet.
  async function loadRanksForGame(gameId: string) {
    if (!gameId) {
      setRankOptions([]);
      setSelectedRankFilter("");
      return;
    }

    // Das Game-Objekt anhand der ID finden
    const game = games.find((g) => g.id === gameId);

    // Wenn wir das Game nicht finden, gibt's nichts zu laden
    if (!game) {
      console.warn("Kein Game für gameId gefunden, breche Rank-Load ab:", gameId);
      setRankOptions([]);
      setSelectedRankFilter("");
      return;
    }

    // Identifier = Game-Code (z.B. "LOL"), weil dein Backend darauf hört
    const identifier = game.code ?? gameId;

    try {
      const ranks: GameRankDto[] = await apiGetGameRanks(identifier);
      const opts: RankOption[] = [
        { value: "", label: "Alle Ranks" },
        ...ranks.map((r) => ({
          // WICHTIG:
          // value = CODE (z.B. "DIAMOND"), der in PlayerGameProfile.rank gespeichert ist
          value: r.code,
          // label = schöner Name (z.B. "Diamond")
          label: r.name,
        })),
      ];
      setRankOptions(opts);
      setSelectedRankFilter("");
    } catch (err) {
      console.error("Failed to load ranks for game", identifier, err);
      // Fallback: nur "Alle Ranks"
      setRankOptions([{ value: "", label: "Alle Ranks" }]);
      setSelectedRankFilter("");
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

  // Wenn Spiel wechselt:
  // - Rollen nachladen
  // - Ranks (aus Seed/DB) nachladen
  // - Filter zurücksetzen
  useEffect(() => {
    if (selectedGameId) {
      ensureRolesLoaded(selectedGameId);
      loadRanksForGame(selectedGameId);
      setSelectedRoleId("");
    } else {
      setRankOptions([]);
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
    setRankOptions([]);
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
            Alle Werte stammen aus euren Game-Definitionen (Seed / GameRank &
            GameRole).
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
              disabled={!selectedGameId || rankOptions.length === 0}
            >
              {!selectedGameId ? (
                <option value="">Erst Spiel auswählen</option>
              ) : (
                rankOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              )}
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
              className="rounded-full border border-border px-5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-200 transition hover:border-[#00eaff] hover:text-[#00eaff] transition"
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

      {loading && <div className="text-sm text-gray-300">Lade Spieler.</div>}

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
                  <Link
                    href={`/players/${player.id}`}
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    Spielerprofil ansehen
                  </Link>
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
