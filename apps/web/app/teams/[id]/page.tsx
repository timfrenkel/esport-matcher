// apps/web/app/teams/[id]/page.tsx

import { apiFetch, TeamProfile } from "../../../lib/api";

interface PageProps {
  params: { id: string };
}

interface TeamGameProfileView {
  id: string;
  gameName: string;
  primaryRoleName: string;
  level: string;
}

export default async function TeamPublicPage({ params }: PageProps) {
  const teamId = params.id;

  // Team-Daten laden
  const team = await apiFetch<any>(`/teams/${teamId}`);

  // Backend kann entweder teamGameProfiles oder gameProfiles senden
  const rawProfiles: any[] =
    team.teamGameProfiles ??
    team.gameProfiles ??
    [];

  const gameProfiles: TeamGameProfileView[] = rawProfiles.map((gp: any) => ({
    id: gp.id,
    // Spielname aus verschachteltem Objekt
    gameName: gp.game?.name ?? "Unbekanntes Spiel",

    // Primärrolle
    primaryRoleName: gp.primaryRole?.name ?? "-",

    // Level pro Spiel
    level: gp.level ?? team.level ?? "-",
  }));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        {team.name} {team.tag ? `[${team.tag}]` : ""}
      </h1>

      <p className="mt-2 text-sm text-gray-400">
        Region: {team.region || "keine Angabe"} · Team-Level: {team.level}
      </p>

      <p className="mt-4 text-gray-300">
        {team.description?.trim?.().length
          ? team.description
          : "Dieses Team hat noch keine Beschreibung hinterlegt."}
      </p>

      <h2 className="text-xl font-semibold mt-6">Spiele & Rollen</h2>

      {gameProfiles.length === 0 ? (
        <p className="mt-2 text-gray-400 text-sm">
          Dieses Team hat noch keine Spiele oder Rollen hinterlegt.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {gameProfiles.map((gp) => (
            <li key={gp.id} className="bg-gray-800 p-3 rounded text-sm">
              <strong>{gp.gameName}</strong>
              <div>Primärrolle: {gp.primaryRoleName}</div>
              <div>Level: {gp.level}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
