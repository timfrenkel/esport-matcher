import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Alle Spiele für Dropdowns etc.
   */
  async findAll() {
    return this.prisma.game.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Einzelnes Spiel nach ID
   */
  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    return game;
  }

  /**
   * Alle Rollen (GameRole) für ein Spiel
   */
  async findRolesForGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    return this.prisma.gameRole.findMany({
      where: {
        gameId,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Alle Ranks (GameRank) für ein Spiel.
   * Optional gefiltert nach roleId (falls du später ranks pro Rolle pflegst).
   */
  async getGameRanks(gameId: string, roleId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    return this.prisma.gameRank.findMany({
      where: {
        gameId,
        ...(roleId ? { roleId } : {}),
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });
  }
}
