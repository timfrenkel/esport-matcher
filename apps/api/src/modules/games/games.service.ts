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

  async getRanksForGame(identifier: string, roleId?: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        OR: [{ id: identifier }, { code: identifier }],
      },
    });

    if (!game) return [];

    return this.prisma.gameRank.findMany({
      where: {
        gameId: game.id,
        ...(roleId ? { roleId } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });
  }
}