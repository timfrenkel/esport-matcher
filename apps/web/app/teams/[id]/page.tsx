export const dynamic = "force-dynamic";
export const revalidate = 0;



import QuickContactRequestButton from "@/components/QuickContactRequestButton";
import { apiFetch } from "../../../lib/api";

interface PageProps {
  params: { id: string };
}

interface TeamGameProfileView {
  id: string;
  gameId: string;
  gameName: string;
  primaryRoleName: string;
  level: string;
}

export default async function TeamPublicPage({ params }: PageProps) {
  const teamId = params.id;

  const team = await apiFetch<any>(`/teams/${teamId}`);

  const rawProfiles: any[] = team.teamGameProfiles ?? team.gameProfiles ?? [];

  const gameProfiles: TeamGameProfileView[] = rawProfiles.map((gp: any) => ({
    id: gp.id,
    gameId: gp.gameId ?? gp.game?.id ?? "",
    gameName: gp.game?.name ?? gp.gameName ?? "Unbekanntes Spiel",
    primaryRoleName: gp.primaryRole?.name ?? gp.primaryRoleName ?? "-",
    level: gp.level ?? gp.competitiveLevel ?? team.level ?? "-",
  }));

  const rawBio = (team.description ?? team.bio ?? "").toString?.() ?? "";
  const bio = rawBio.trim();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        {team.name} {team.tag ? `[${team.tag}]` : ""}
      </h1>

      <p className="mt-2 text-sm text-gray-400">
        Region: {team.region || "keine Angabe"} · Team-Level: {team.level}
      </p>

      <p className="mt-4 text-gray-300">
        {bio.length ? bio : "Dieses Team hat noch keine Beschreibung hinterlegt."}
      </p>

      <h2 className="text-xl font-semibold mt-6">Spiele & Rollen</h2>

      {gameProfiles.length === 0 ? (
        <p className="mt-2 text-gray-400 text-sm">
          Dieses Team hat noch keine Spiele oder Rollen hinterlegt.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {gameProfiles.map((gp) => (
            <li
              key={gp.id}
              className="bg-gray-800 p-3 rounded text-sm flex items-start justify-between gap-3"
            >
              <div>
                <strong>{gp.gameName}</strong>
                <div>Primärrolle: {gp.primaryRoleName}</div>
                <div>Level: {gp.level}</div>
              </div>

              <QuickContactRequestButton
                targetType="TEAM"
                targetId={teamId}
                gameId={gp.gameId}
                gameName={gp.gameName}
                roleName={gp.primaryRoleName}
                level={gp.level}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
