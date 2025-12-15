export const dynamic = "force-dynamic";
export const revalidate = 0;



import QuickContactRequestButton from "@/components/QuickContactRequestButton";
import { apiFetch, PlayerProfile } from "../../../lib/api";

interface PageProps {
  params: { id: string };
}

interface GameProfileView {
  id: string;
  gameId: string;
  gameName: string;
  primaryRoleName: string;
  rank: string | null;
}

export default async function PlayerPublicPage({ params }: PageProps) {
  const playerId = params.id;

  const player = await apiFetch<PlayerProfile>(`/players/${playerId}`);

  const rawGameProfiles: any[] = (player as any).gameProfiles ?? [];

  const gameProfiles: GameProfileView[] = rawGameProfiles.map((gp: any) => ({
    id: gp.id,
    gameId: gp.gameId ?? gp.game?.id ?? "",
    gameName: gp.gameName ?? gp.game?.name ?? "Unbekanntes Spiel",
    primaryRoleName: gp.primaryRoleName ?? gp.primaryRole?.name ?? "-",
    rank: gp.rank ?? null,
  }));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        {player.displayName || "Unbenannter Spieler"}
      </h1>

      <p className="mt-2 text-sm text-gray-400">
        Region: {player.region || "keine Angabe"} ·{" "}
        {player.isPro ? "Pro/E-Sport" : "Semi-Competitive"}
      </p>

      <p className="mt-4 text-gray-300">
        {player.bio && player.bio.trim().length > 0
          ? player.bio
          : "Dieser Spieler hat noch keine Beschreibung hinterlegt."}
      </p>

      <h2 className="text-xl font-semibold mt-6">Spiele & Rollen</h2>

      {gameProfiles.length === 0 ? (
        <p className="mt-2 text-gray-400 text-sm">
          Dieser Spieler hat noch keine Spiele hinterlegt.
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
                <div>Rolle: {gp.primaryRoleName}</div>
                <div>Rank: {gp.rank ?? "-"}</div>
              </div>

              <QuickContactRequestButton
                targetType="PLAYER"
                targetId={playerId}
                gameId={gp.gameId}
                gameName={gp.gameName}
                roleName={gp.primaryRoleName}
                rank={gp.rank}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
