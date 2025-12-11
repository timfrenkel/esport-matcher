"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  apiGetMyTeamProfile,
  apiUpdateMyTeamProfile,
  apiGetGames,
  apiGetGameRoles,
  apiUpsertTeamGameProfiles,
  GameDto,
  GameRoleDto,
} from "@/lib/api";
import { REGION_OPTIONS } from "@/lib/regions";
import { TEAM_LEVEL_OPTIONS } from "@/lib/teamlevels";

type Visibility = "PUBLIC" | "PRIVATE";

type TeamGameProfileRow = {
  id?: string;
  gameId: string;
  primaryRoleId?: string;
  level?: string;
};

export default function MyTeamProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGames, setSavingGames] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Stammdaten
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [level, setLevel] = useState("CASUAL");

  // Games / Rollen / offene Rollen
  const [games, setGames] = useState<GameDto[]>([]);
  const [rolesByGame, setRolesByGame] = useState<Record<string, GameRoleDto[]>>(
    {},
  );
  const [gameRows, setGameRows] = useState<TeamGameProfileRow[]>([]);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [gamesSuccess, setGamesSuccess] = useState<string | null>(null);

  // --------------------------------------------------
  // Hilfsfunktion: Rollen nachladen (für Dropdown)
  // --------------------------------------------------
  const ensureRolesLoaded = async (gameId: string) => {
    if (!gameId) return;
    if (rolesByGame[gameId]) return;

    try {
      const roles = await apiGetGameRoles(gameId);
      setRolesByGame((prev) => ({ ...prev, [gameId]: roles }));
    } catch (err) {
      console.error("Fehler beim Laden der Rollen für Spiel", gameId, err);
    }
  };

  // --------------------------------------------------
  // Initial load: Teamprofil + Spiele + vorhandene Game-Profile
  // --------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setGamesError(null);
      setGamesSuccess(null);

      try {
        const [p, allGames] = await Promise.all([
          apiGetMyTeamProfile(),
          apiGetGames(),
        ]);

        setProfile(p);
        setGames(allGames);

        // Stammdaten setzen
        setName(p.name ?? "");
        setTag(p.tag ?? "");
        setRegion(p.region ?? "");
        setBio(p.bio ?? "");
        setVisibility((p.visibility as Visibility) ?? "PUBLIC");
        setLevel(p.level ?? "CASUAL");

        // vorhandene Game-Profile in Edit-Struktur mappen
        const existingGameProfiles: any[] = Array.isArray(p.gameProfiles)
          ? p.gameProfiles
          : [];

        const initialRows: TeamGameProfileRow[] = existingGameProfiles.map(
          (gp) => ({
            id: gp.id,
            gameId: String(gp.gameId),
            primaryRoleId: gp.primaryRoleId ?? undefined,
            level: gp.competitiveLevel ?? gp.level ?? undefined,
          }),
        );

        setGameRows(initialRows);

        // Rollen für alle vorhandenen Spiele vorladen
        const uniqueGameIds = Array.from(
          new Set(initialRows.map((r) => r.gameId).filter(Boolean)),
        ) as string[];

        if (uniqueGameIds.length > 0) {
          const rolesArrays = await Promise.all(
            uniqueGameIds.map((gid) => apiGetGameRoles(gid)),
          );

          const map: Record<string, GameRoleDto[]> = {};
          uniqueGameIds.forEach((gid, idx) => {
            map[gid] = rolesArrays[idx];
          });
          setRolesByGame((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error(err);
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Konnte Teamprofil nicht laden.");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Stammdaten speichern
  // --------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const payload: any = {
      name,
      tag: tag || undefined,
      region: region || undefined,
      bio: bio || undefined,
      visibility,
      level,
      // isPro lassen wir weg, weil du meintest, das Feld verwirrt eher
    };

    try {
      const updated = await apiUpdateMyTeamProfile(payload);
      setProfile(updated);
      setSuccess("Teamprofil gespeichert.");
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Fehler beim Speichern des Teamprofils.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // --------------------------------------------------
  // Game-Profile / offene Rollen bearbeiten
  // --------------------------------------------------
  const handleAddGameRow = () => {
    setGameRows((prev) => [
      ...prev,
      {
        id: undefined,
        gameId: "",
        primaryRoleId: undefined,
        level: "",
      },
    ]);
  };

  const handleRemoveGameRow = (index: number) => {
    setGameRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGameRow = (
    index: number,
    patch: Partial<TeamGameProfileRow>,
  ) => {
    setGameRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleSaveGameProfiles = async () => {
    if (!profile) return;

    setSavingGames(true);
    setGamesError(null);
    setGamesSuccess(null);

    const payload = gameRows
      .filter((row) => row.gameId)
      .map((row) => ({
        id: row.id,
        gameId: row.gameId,
        primaryRoleId: row.primaryRoleId || undefined,
        level: row.level || undefined,
      }));

    try {
      await apiUpsertTeamGameProfiles(profile.id, payload);
      setGamesSuccess("Offene Rollen / Game-Profile gespeichert.");
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setGamesError(err.message);
      } else {
        setGamesError("Fehler beim Speichern der Game-Profile.");
      }
    } finally {
      setSavingGames(false);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-300">
        <p>Lade Teamprofil ...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8 text-sm text-gray-200">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Mein Teamprofil</h1>
        <p className="text-xs text-gray-400">
          Hier verwaltest du die Stammdaten deines Teams und offene Rollen /
          Game-Profile. Nur Team-Owner mit Team-Account sehen diese Seite.
        </p>
      </header>

      {/* Fehler / Erfolg global für Stammdaten */}
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {success}
        </div>
      )}

      {/* Stammdaten-Karte */}
      <section className="rounded-2xl border border-white/5 bg-black/40 p-5 shadow-lg shadow-black/40">
        <h2 className="text-base font-semibold text-white">
          Team-Stammdaten &amp; Sichtbarkeit
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Name, Tag, Server, Level &amp; Sichtbarkeit deines Teams.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-300">
                Teamname
              </label>
              <input
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
              <p className="text-[11px] text-gray-500">
                Offizieller Name des Teams (max. 50 Zeichen).
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-300">
                Tag / Kürzel
              </label>
              <input
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                maxLength={10}
              />
              <p className="text-[11px] text-gray-500">
                Optionales Kürzel, z. B. &quot;G2&quot; (max. 10 Zeichen).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Region / Server als Dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-300">
                Region / Server
              </label>
              <select
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Bitte wählen</option>
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Wird in der Team- &amp; Spielersuche als Server-Filter
                verwendet.
              </p>
            </div>

            {/* Team-Level (global) */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-300">
                Team-Level / Ambition (global)
              </label>
              <select
                className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {TEAM_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Wird in der Suche als &quot;Level&quot;-Filter für dein Team
                verwendet.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-300">
              Kurzbeschreibung / Bio
            </label>
            <textarea
              className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/70"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={400}
            />
            <p className="text-[11px] text-gray-500">
              Optional: Beschreibe euer Team, Ziele, Spielstil usw. (max. 400
              Zeichen).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="space-x-3 text-xs text-gray-300">
              <span>Sichtbarkeit:</span>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                />
                <span>Öffentlich</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={visibility === "PRIVATE"}
                  onChange={() => setVisibility("PRIVATE")}
                />
                <span>Privat</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Speichere ..." : "Stammdaten speichern"}
            </button>
          </div>
        </form>
      </section>

      {/* Offene Rollen / Game-Profile */}
      <section className="rounded-2xl border border-white/5 bg-black/40 p-5 shadow-lg shadow-black/40">
        <h2 className="text-base font-semibold text-white">
          Offene Rollen / Game-Profile
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Hier hinterlegst du pro Spiel eure offenen Rollen.
        </p>

        {gamesError && (
          <div className="mt-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {gamesError}
          </div>
        )}
        {gamesSuccess && (
          <div className="mt-3 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {gamesSuccess}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {gameRows.length === 0 && (
            <p className="text-xs text-gray-500">
              Noch keine Game-Profile hinterlegt. Füge unten eine erste
              Zeile hinzu.
            </p>
          )}

          {gameRows.map((row, index) => {
            const roles = row.gameId ? rolesByGame[row.gameId] ?? [] : [];

            return (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-xs text-gray-200"
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {/* Spiel */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Spiel
                    </label>
                    <select
                      className="w-full rounded-md border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={row.gameId}
                      onChange={async (e) => {
                        const newGameId = e.target.value;
                        updateGameRow(index, {
                          gameId: newGameId,
                          primaryRoleId: undefined,
                        });
                        if (newGameId) {
                          await ensureRolesLoaded(newGameId);
                        }
                      }}
                    >
                      <option value="">Bitte Spiel wählen</option>
                      {games.map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primärrolle */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Primärrolle (optional)
                    </label>
                    <select
                      className="w-full rounded-md border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={row.primaryRoleId ?? ""}
                      onChange={(e) =>
                        updateGameRow(index, {
                          primaryRoleId: e.target.value || undefined,
                        })
                      }
                      disabled={!row.gameId}
                    >
                      <option value="">Keine Angabe</option>
                      {roles.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Level / Ambition pro Spiel */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Level (für dieses Spiel)
                    </label>
                    <select
                      className="w-full rounded-md border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={row.level ?? ""}
                      onChange={(e) =>
                        updateGameRow(index, {
                          level: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">Globales Team-Level nutzen</option>
                      {TEAM_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveGameRow(index)}
                    className="text-[11px] text-red-300 hover:text-red-200"
                  >
                    Zeile entfernen
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddGameRow}
            className="rounded-md border border-emerald-500/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
          >
            + Spiel / Rolle hinzufügen
          </button>

          <button
            type="button"
            disabled={savingGames}
            onClick={handleSaveGameProfiles}
            className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-black shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingGames ? "Speichere ..." : "Offene Rollen speichern"}
          </button>
        </div>
      </section>
    </main>
  );
}
