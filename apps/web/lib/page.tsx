"use client";

import { useEffect, useState } from "react";
import { ApiError, apiGetMyTeams, TeamProfile } from "@lib/api";
import { useRouter } from "next/navigation";

export default function MyTeamsPage() {
  const router = useRouter();

  const [teams, setTeams] = useState<TeamProfile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await apiGetMyTeams();
        if (!cancelled) {
          setTeams(result);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Konnte Teamdaten nicht laden.");
          }
          console.error("Load my teams error", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-[80vh] justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Mein Team
            </h1>
            <p className="text-xs text-gray-400">
              Übersicht über deine Team-Profile.
            </p>
          </div>

          <button
            type="button"
            className="rounded-2xl border border-border px-3 py-1.5 text-xs text-gray-300 hover:border-accent hover:text-accent"
            onClick={() => router.push("/dashboard")}
          >
            Zurück zum Dashboard
          </button>
        </header>

        {loading && (
          <p className="text-xs text-gray-400">Lade Teamdaten...</p>
        )}

        {!loading && error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {!loading && !error && teams && teams.length === 0 && (
          <div className="card p-4 text-xs text-gray-300">
            <p>Noch kein Team-Profil gefunden.</p>
            <p className="mt-1 text-gray-500">
              Das ist okay – später fügen wir hier Team-Erstellung und Verwaltung hinzu.
            </p>
          </div>
        )}

        {!loading && !error && teams && teams.length > 0 && (
          <div className="space-y-4">
            {teams.map(team => (
              <section
                key={team.id}
                className="card border border-border/60 bg-surface/70 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-base font-semibold text-white">
                        {team.name}
                      </h2>
                      {team.tag && (
                        <span className="text-[10px] uppercase tracking-wide text-accent">
                          [{team.tag}]
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Level: {team.level} •{" "}
                      {team.isPro ? "Pro-Team" : "Semi-Competitive"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-[11px] text-gray-300 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] uppercase text-gray-500">
                      Region
                    </div>
                    <div>{team.region ?? "–"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-500">
                      Zeitzone
                    </div>
                    <div>{team.timezone ?? "–"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-500">
                      Sprachen
                    </div>
                    <div>
                      {team.languages && team.languages.length > 0
                        ? team.languages.join(", ")
                        : "–"}
                    </div>
                  </div>
                </div>

                {team.bio && (
                  <p className="mt-3 text-[11px] text-gray-300">
                    {team.bio}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
