"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  PlayerProfile,
  PlayerGameProfileDto,
  UpdatePlayerProfileInput,
  apiGetMyPlayerProfile,
  apiUpdateMyPlayerProfile,
  apiGetGames,
  apiGetGameRoles,
  apiGetGameRanks,
  apiUpsertMyPlayerGameProfiles,
  apiUploadMedia,
  mediaUrl,
  GameDto,
  GameRoleDto,
  GameRankDto,
} from "@/lib/api";
import { REGION_OPTIONS } from "@/lib/regions";

type Option = { value: string; label: string };

const LANGUAGE_OPTIONS: Option[] = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Französisch" },
  { value: "es", label: "Spanisch" },
  { value: "pl", label: "Polnisch" },
  { value: "tr", label: "Türkisch" },
  { value: "pt", label: "Portugiesisch" },
  { value: "ru", label: "Russisch" },
];

interface EditablePlayerGameProfile {
  id?: string;
  gameId: string;
  primaryRoleId?: string;
  rank?: string;
}

export default function MyPlayerProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGames, setSavingGames] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Basis-Profil-Form
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // 🔥 Bild + Preview
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Game-Profile-Form
  const [games, setGames] = useState<GameDto[]>([]);
  const [rolesByGame, setRolesByGame] = useState<Record<string, GameRoleDto[]>>(
    {},
  );
  const [ranksByGame, setRanksByGame] = useState<Record<string, GameRankDto[]>>(
    {},
  );
  const [gameProfiles, setGameProfiles] = useState<EditablePlayerGameProfile[]>(
    [],
  );
  const [loadingGameMeta, setLoadingGameMeta] = useState(false);

  const ensureRolesLoaded = async (gameId: string) => {
    if (!gameId) return;
    if (rolesByGame[gameId]) return;

    try {
      const roles = await apiGetGameRoles(gameId);
      setRolesByGame((prev) => ({ ...prev, [gameId]: roles }));
    } catch (err) {
      console.error("Failed to load roles for game", gameId, err);
    }
  };

  const ensureRanksLoaded = async (gameId: string) => {
    if (!gameId) return;
    if (ranksByGame[gameId]) return;

    try {
      const ranks = await apiGetGameRanks(gameId);
      // ✅ FIX: ...prev (nicht .prev)
      setRanksByGame((prev) => ({ ...prev, [gameId]: ranks }));
    } catch (err) {
      console.error("Failed to load ranks for game", gameId, err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        setLoadingGameMeta(true);
        const [p, gamesData] = await Promise.all([
          apiGetMyPlayerProfile(),
          apiGetGames(),
        ]);

        setProfile(p);

        // ✅ Profilbild initial übernehmen
        setProfileImageKey((p as any).profileImageKey ?? null);

        // Basis-Profil in Form füllen
        setDisplayName(p.displayName ?? "");
        setRegion(p.region ?? "");
        setLanguages(p.languages || []);
        setBio(p.bio ?? "");
        setVisibility(p.visibility);

        const mappedGameProfiles: EditablePlayerGameProfile[] =
          (p.gameProfiles as PlayerGameProfileDto[] | undefined)?.map((gp) => ({
            id: gp.id,
            gameId: gp.gameId,
            primaryRoleId: gp.primaryRoleId ?? undefined,
            rank: gp.rank ?? "",
          })) ?? [];

        setGameProfiles(mappedGameProfiles);
        setGames(gamesData);

        const uniqueGameIds = Array.from(
          new Set(mappedGameProfiles.map((gp) => gp.gameId).filter(Boolean)),
        ) as string[];

        for (const gid of uniqueGameIds) {
          await Promise.all([ensureRolesLoaded(gid), ensureRanksLoaded(gid)]);
        }
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError("Konnte Profil nicht laden.");
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingGameMeta(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError(null);
    setSuccess(null);

    try {
      const { storageKey } = await apiUploadMedia(file);
      setProfileImageKey(storageKey);
      setSuccess("Profilbild hochgeladen. Jetzt noch speichern.");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Upload fehlgeschlagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ✅ 3.6: Profil speichern inkl. profileImageKey
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const payload: UpdatePlayerProfileInput & { profileImageKey?: string | null } =
      {
        displayName,
        region: region || undefined,
        languages,
        bio: bio || undefined,
        isPro: false,
        visibility,
        profileImageKey: profileImageKey ?? null,
      };

    try {
      const updated = await apiUpdateMyPlayerProfile(payload as any);
      setProfile(updated);
      setProfileImageKey((updated as any).profileImageKey ?? profileImageKey);
      setSuccess("Basis-Profil gespeichert.");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Fehler beim Speichern des Profils.");
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

    const payload: UpdatePlayerProfileInput = {
    displayName,
    region: region || undefined,
    languages,
    bio: bio || undefined,
    isPro: false,
    visibility,
    profileImageKey: profileImageKey ?? null,
  };

  const handleAddGameProfile = () => {
    setGameProfiles((prev) => [
      ...prev,
      { gameId: "", primaryRoleId: undefined, rank: "" },
    ]);
  };

  const handleRemoveGameProfile = (index: number) => {
    setGameProfiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGameProfileChange = <K extends keyof EditablePlayerGameProfile>(
    index: number,
    field: K,
    value: EditablePlayerGameProfile[K],
  ) => {
    setGameProfiles((prev) =>
      prev.map((gp, i) => (i === index ? { ...gp, [field]: value } : gp)),
    );
  };

  const handleSaveGameProfiles = async () => {
    if (!profile) return;

    setSavingGames(true);
    setError(null);
    setSuccess(null);

    const payload = gameProfiles
      .filter((gp) => gp.gameId)
      .map((gp) => ({
        id: gp.id || undefined,
        gameId: gp.gameId,
        primaryRoleId: gp.primaryRoleId || undefined,
        rank: gp.rank || undefined,
      }));

    try {
      const updated = await apiUpsertMyPlayerGameProfiles(payload);
      setProfile(updated);

      const updatedGameProfiles: EditablePlayerGameProfile[] =
        (updated.gameProfiles as PlayerGameProfileDto[] | undefined)?.map(
          (gp) => ({
            id: gp.id,
            gameId: gp.gameId,
            primaryRoleId: gp.primaryRoleId ?? undefined,
            rank: gp.rank ?? "",
          }),
        ) ?? [];

      setGameProfiles(updatedGameProfiles);
      setSuccess("Game-Profile gespeichert.");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Fehler beim Speichern der Game-Profile.");
      console.error(err);
    } finally {
      setSavingGames(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Lade dein Spielerprofil...</p>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="card max-w-md p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-2 text-xs text-gray-500">
            Stelle sicher, dass du eingeloggt bist und als Spieler registriert
            wurdest.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Mein Spielerprofil</h1>
        <p className="text-sm text-gray-400">
          Dein Basis-Profil + Game-spezifische Infos bilden die Grundlage für
          Matching &amp; Filter in der Spieler- und Teamsuche.
        </p>
      </div>

      {/* Basis-Profil */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-200">
          Basis-Profil &amp; Sichtbarkeit
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Anzeigename, Region, Sprachen &amp; Sichtbarkeit bestimmen, wie du in
          Listen auftauchst.
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleProfileSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {profileImageKey ? (
                  <img
                    src={mediaUrl(profileImageKey)}
                    alt="Profilbild"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                    Kein Bild
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-300">Profilbild</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProfileImageUpload(f);
                  }}
                  className="text-xs text-gray-300"
                />
                <div className="text-[10px] text-gray-500">
                  {uploadingImage ? "Lade hoch..." : "PNG/JPG/WEBP bis 8MB."}
                </div>
              </div>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium text-gray-200 hover:border-accent hover:text-accent"
                >
                  Vorschau
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400" htmlFor="displayName">
                Anzeigename
              </label>
              <input
                id="displayName"
                type="text"
                required
                maxLength={50}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-gray-500">
                Wird überall angezeigt – z.B. in der Suche &amp; im Matching.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400" htmlFor="region">
                Server / Region
              </label>
              <select
                id="region"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
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
            </div>

            <div>
              <label className="block text-xs text-gray-400" htmlFor="languages">
                Sprachen
              </label>
              <select
                id="languages"
                multiple
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
                value={languages}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  );
                  setLanguages(selected);
                }}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-gray-500">
                Strg / Cmd halten, um mehrere Sprachen auszuwählen.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400" htmlFor="bio">
              Kurzbeschreibung
            </label>
            <textarea
              id="bio"
              maxLength={400}
              rows={3}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-gray-500">
              Max. 400 Zeichen – z.B. Rolle, Erfahrung, was du suchst.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span>Sichtbarkeit:</span>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${
                  visibility === "PUBLIC"
                    ? "bg-accent text-black"
                    : "bg-surface text-gray-300"
                }`}
                onClick={() => setVisibility("PUBLIC")}
              >
                Öffentlich
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${
                  visibility === "PRIVATE"
                    ? "bg-accent text-black"
                    : "bg-surface text-gray-300"
                }`}
                onClick={() => setVisibility("PRIVATE")}
              >
                Privat
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Stelle sicher, dass Region &amp; Sprachen korrekt sind – sie werden
              für Filter &amp; Matching verwendet.
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-soft-neon transition hover:bg-accent/80 disabled:opacity-60"
            >
              {savingProfile ? "Speichern..." : "Basis-Profil speichern"}
            </button>
          </div>

          {error && (
            <div className="mt-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-2 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {success}
            </div>
          )}
        </form>
      </div>

      {/* Game-Profile */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-200">
          Game-Profile &amp; Ranks
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Füge Spiele, deine Hauptrolle und ggf. deinen Rank hinzu. Diese Infos
          werden für Filtering &amp; Matching in der Team-Suche verwendet.
        </p>

        {loadingGameMeta && (
          <p className="mt-3 text-xs text-gray-400">
            Lade Spiele &amp; Rollen...
          </p>
        )}

        {games.length === 0 && !loadingGameMeta && (
          <p className="mt-3 text-xs text-gray-400">
            Noch keine Games im System hinterlegt.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {gameProfiles.length === 0 && (
            <p className="text-[11px] text-gray-500">
              Noch keine Game-Profile angelegt. Füge mindestens ein Spiel hinzu,
              damit Teams dich finden können.
            </p>
          )}

          {gameProfiles.map((gp, index) => {
            const roles =
              gp.gameId && rolesByGame[gp.gameId] ? rolesByGame[gp.gameId] : [];
            const ranks =
              gp.gameId && ranksByGame[gp.gameId] ? ranksByGame[gp.gameId] : [];

            return (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-border bg-surface/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-200">
                    Game-Profil #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGameProfile(index)}
                    className="text-[11px] text-red-300 hover:text-red-200"
                  >
                    Entfernen
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Spiel
                    </label>
                    <select
                      className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={gp.gameId}
                      onChange={async (e) => {
                        const newGameId = e.target.value;
                        handleGameProfileChange(index, "gameId", newGameId);
                        if (newGameId) {
                          await Promise.all([
                            ensureRolesLoaded(newGameId),
                            ensureRanksLoaded(newGameId),
                          ]);
                        }
                      }}
                    >
                      <option value="">Bitte wählen</option>
                      {games.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Hauptrolle
                    </label>
                    <select
                      className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={gp.primaryRoleId ?? ""}
                      onChange={(e) =>
                        handleGameProfileChange(
                          index,
                          "primaryRoleId",
                          e.target.value || undefined,
                        )
                      }
                      disabled={!gp.gameId}
                    >
                      <option value="">
                        {gp.gameId ? "Optional wählen" : "Erst Spiel wählen"}
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Rank / Elo
                    </label>
                    <select
                      className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/70"
                      value={gp.rank ?? ""}
                      onChange={(e) =>
                        handleGameProfileChange(
                          index,
                          "rank",
                          e.target.value || "",
                        )
                      }
                      disabled={!gp.gameId}
                    >
                      <option value="">
                        {gp.gameId ? "Optional wählen" : "Erst Spiel wählen"}
                      </option>
                      {ranks.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddGameProfile}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium text-gray-200 hover:border-accent hover:text-accent"
          >
            Game-Profil hinzufügen
          </button>
          <button
            type="button"
            disabled={savingGames}
            onClick={handleSaveGameProfiles}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black shadow-soft-neon transition hover:bg-accent/80 disabled:opacity-60"
          >
            {savingGames ? "Speichern..." : "Game-Profile speichern"}
          </button>
        </div>

        {error && (
          <div className="mt-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-2 rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {success}
          </div>
        )}
      </div>

      {/* ✅ 3.7 Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Profil Vorschau
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-xs text-gray-300 hover:text-white"
              >
                Schließen
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-3xl font-bold text-white">
                {displayName || "Unbenannter Spieler"}
              </h1>

              {profileImageKey ? (
                <img
                  src={mediaUrl(profileImageKey)}
                  alt="Profilbild"
                  className="mt-4 h-28 w-28 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="mt-4 h-28 w-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400">
                  Kein Profilbild
                </div>
              )}

              <p className="mt-2 text-sm text-gray-400">
                Region: {region || "keine Angabe"} · Semi-Competitive
              </p>

              <p className="mt-4 text-gray-300">
                {bio && bio.trim().length > 0
                  ? bio
                  : "Dieser Spieler hat noch keine Beschreibung hinterlegt."}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
