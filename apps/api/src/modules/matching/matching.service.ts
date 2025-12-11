// apps/api/src/modules/matching/matching.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Teams für einen bestimmten Spieler vorschlagen
   * - gleiche Games
   * - gleiche Region (wenn gesetzt)
   * - nur öffentliche Teamprofile
   */
  async suggestTeamsForPlayer(playerId: string) {
    // Spieler inkl. GameProfiles laden
    const player = (await this.prisma.playerProfile.findUnique({
      where: { id: playerId },
      include: {
        gameProfiles: true,
      },
    } as any)) as any;

    if (!player) {
      throw new NotFoundException("Player profile not found");
    }

    const playerRegion: string | null = player.region ?? null;

    // Game-IDs des Spielers sammeln
    const gameIds: string[] = Array.from(
      new Set<string>(
        (player.gameProfiles ?? [])
          .map((gp: any) => gp.gameId)
          .filter((id: any): id is string => Boolean(id)),
      ),
    );

    // Basis-Filter: nur öffentliche Teams
    const where: any = {
      visibility: "PUBLIC",
    };

    if (playerRegion) {
      where.region = playerRegion;
    }

    if (gameIds.length > 0) {
      // WICHTIG: TeamProfile hat in deinem Prisma-Schema die Relation "teamGameProfiles"
      (where as any).teamGameProfiles = {
        some: {
          gameId: { in: gameIds },
        },
      };
    }

    const teams = await this.prisma.teamProfile.findMany({
      where,
      // Kein include nötig – Dashboard braucht erstmal nur Basisdaten
    } as any);

    return teams;
  }

  /**
   * Spieler für ein bestimmtes Team vorschlagen
   * - gleiche Games
   * - gleiche Region (wenn gesetzt)
   * - nur öffentliche Spielerprofile
   */
  async suggestPlayersForTeam(teamId: string) {
    const team = (await this.prisma.teamProfile.findUnique({
      where: { id: teamId },
      include: {
        teamGameProfiles: true,
      },
    } as any)) as any;

    if (!team) {
      throw new NotFoundException("Team profile not found");
    }

    const teamRegion: string | null = team.region ?? null;

    const gameIds: string[] =
      (team.teamGameProfiles ?? [])
        .map((gp: any) => gp.gameId)
        .filter((id: any): id is string => Boolean(id)) || [];

    if (gameIds.length === 0) {
      return [];
    }

    const players = await this.prisma.playerProfile.findMany({
      where: {
        visibility: "PUBLIC",
        gameProfiles: {
          some: {
            gameId: { in: gameIds },
          },
        },
        ...(teamRegion
          ? {
              region: teamRegion,
            }
          : {}),
        ...(team.isPro
          ? {
              isPro: true,
            }
          : {}),
      },
      include: {
        gameProfiles: true,
      },
    } as any);

    return players;
  }

  /**
   * Wrapper für alte Controller-Methoden
   */
  async getTeamsForPlayer(playerId: string) {
    return this.suggestTeamsForPlayer(playerId);
  }

  async getPlayersForTeam(teamId: string) {
    return this.suggestPlayersForTeam(teamId);
  }

  /**
   * Matches "für mich" (aktueller User) – nutzt Player-/Teamprofil
   */
  async getTeamsForCurrentUser(userId: string) {
    const player = await this.prisma.playerProfile.findFirst({
      where: { userId },
    });

    if (!player) {
      throw new NotFoundException("Player profile for current user not found");
    }

    return this.suggestTeamsForPlayer(player.id);
  }

  async getPlayersForCurrentUser(userId: string) {
    const team = await this.prisma.teamProfile.findFirst({
      where: { userId },
    });

    if (!team) {
      throw new NotFoundException("Team profile for current user not found");
    }

    return this.suggestPlayersForTeam(team.id);
  }
}
