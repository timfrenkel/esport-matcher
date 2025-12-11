import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdatePlayerProfileDto } from "./dto/update-player-profile.dto";
import { UpsertPlayerGameProfileDto } from "./dto/upsert-player-game-profile.dto";
import { SearchPlayersDto } from "./dto/search-players.dto";
import { normalizeRegion } from "../../common/region-normalizer";


@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Spielerprofil des aktuellen Users holen (inkl. Game-Profile)
   */
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        playerProfile: {
          include: {
            gameProfiles: {
              include: {
                game: true,
                primaryRole: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.playerProfile) {
      throw new NotFoundException("Player profile for user not found");
    }

    return user.playerProfile;
  }
  
  
  async getMyPlayerProfile(userId: string) {
    // kleiner Alias, damit der Controller happy ist
    return this.getMyProfile(userId);
  }


  async getPublicPlayerProfile(playerId: string) {
    const player = await this.prisma.playerProfile.findUnique({
      where: { id: playerId },
      include: {
        gameProfiles: {
          include: {
            game: true,
            primaryRole: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException("Spielerprofil nicht gefunden");
    }

    return player;
  }

  /**
   * Spielerprofil des aktuellen Users updaten
   */
  async updateMyProfile(userId: string, dto: UpdatePlayerProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user || !user.playerProfile) {
      throw new NotFoundException("Player profile for user not found");
    }

    return this.prisma.playerProfile.update({
      where: { id: user.playerProfile.id },
      data: {
        displayName: dto.displayName,
        region: normalizeRegion(dto.region),
        timezone: dto.timezone ?? null,
        languages: dto.languages ?? [],
        bio: dto.bio ?? null,
        isPro: dto.isPro ?? false,
        visibility: dto.visibility,
      },
      include: {
        user: { select: { id: true, email: true } },
        gameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true } },
        gameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Player profile for user not found");
    }

    return profile;
  }

  /**
   * Game-Profile für einen Spieler (per PlayerProfileId) upserten.
   *
   * Verhalten:
   * - alle bestehenden Game-Profile dieses Spielers werden gelöscht
   * - alle übergebenen Game-Profile (dtos) werden neu angelegt
   *
   * => Entfernen im UI entfernt auch wirklich in der DB.
   */

  async upsertPlayerGameProfiles(
    playerProfileId: string,
    dtos: UpsertPlayerGameProfileDto[],
  ) {
    const playerId = playerProfileId;

    // 1) Alte Game-Profile komplett löschen
    await this.prisma.playerGameProfile.deleteMany({
      where: { playerId },
    });

    // 2) Neue Game-Profile aus DTO erzeugen (nur mit gameId)
    const createOps = dtos
      .filter((dto) => dto.gameId)
      .map((dto) =>
        this.prisma.playerGameProfile.create({
          data: {
            playerId,                          // PlayerProfile.id
            gameId: dto.gameId,
            primaryRoleId: dto.primaryRoleId ?? null,
            rank: dto.rank ?? null,
            // mmr und lookingForTeam sind entfernt,
            // weil sie im Prisma-Model nicht existieren
          },
        }),
      );

    // 3) Alle Create-Operationen parallel ausführen
    await this.prisma.$transaction(createOps);
  }

  /**
   * Einzelnen Spieler (PlayerProfile) per ID holen – inkl. User & Game-Profile.
   */
  async findOne(id: string) {
    const player = await this.prisma.playerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        gameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });

    if (!player) {
      throw new NotFoundException("Player not found");
    }

    return player;
  }

  /**
   * Spielerprofil anhand der User-ID finden.
   */

  /**
   * Spielersuche mit Filtern (Spiel, Rolle, Region, Sprache, Rank, Textsuche).
   */
  async list(params: SearchPlayersDto) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: any = {
      user: { role: "PLAYER" },
    };

    // Freitext auf DisplayName + E-Mail
    if (params.q) {
      where.OR = [
        { displayName: { contains: params.q, mode: "insensitive" } },
        { user: { email: { contains: params.q, mode: "insensitive" } } },
      ];
    }

    // Region
    if (params.region) {
      where.region = params.region;
    }

    // Sprache (languages-Array enthält Code)
    if (params.language) {
      where.languages = { has: params.language };
    }

    // Optional: isPro-Flag (separater Toggle, falls du ihn nutzen willst)
    if (typeof params.isPro === "boolean") {
      where.isPro = params.isPro;
    }

    // Game / Role / Rank -> über GameProfiles
    if (params.gameId || params.roleId || params.rank) {
      const gameProfileWhere: any = {};

      if (params.gameId) {
        gameProfileWhere.gameId = params.gameId;
      }
      if (params.roleId) {
        gameProfileWhere.primaryRoleId = params.roleId;
      }
      if (params.rank) {
        // 1:1 Match auf den Rank-String (z.B. "Diamond")
        gameProfileWhere.rank = params.rank;
      }

      where.gameProfiles = { some: gameProfileWhere };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.playerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
          gameProfiles: {
            include: { game: true, primaryRole: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.playerProfile.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Spielerprofil direkt per ID updaten (z.B. Admin / PUT /players/:id)
   */
  async updateById(id: string, dto: UpdatePlayerProfileDto) {
    const existing = await this.prisma.playerProfile.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Player not found");
    }

    return this.prisma.playerProfile.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        region: dto.region ?? existing.region,
        timezone: dto.timezone ?? existing.timezone,
        languages: dto.languages ?? existing.languages,
        bio: dto.bio ?? existing.bio,
        isPro: dto.isPro ?? existing.isPro,
        visibility: dto.visibility ?? existing.visibility,
      },
      include: {
        user: { select: { id: true, email: true } },
        gameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });
  }

  // ---------------------------------------------------------
  // Wrapper-Methoden für den Controller
  // ---------------------------------------------------------

  async searchPlayers(query: SearchPlayersDto) {
    return this.list(query);
  }

  async updateProfileByUserId(userId: string, dto: UpdatePlayerProfileDto) {
    return this.updateMyProfile(userId, dto);
  }

  async upsertGameProfilesByUserId(
    userId: string,
    dtos: UpsertPlayerGameProfileDto[],
  ) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Player profile for user not found");
    }

    await this.upsertPlayerGameProfiles(profile.id, dtos);

    // aktualisiertes Profil inkl. GameProfiles zurückgeben
    return this.prisma.playerProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: { select: { id: true, email: true } },
        gameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.findOne(id);
  }

  async updateProfile(id: string, dto: UpdatePlayerProfileDto) {
    return this.updateById(id, dto);
  }
}
