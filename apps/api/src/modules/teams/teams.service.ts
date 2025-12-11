import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ProfileVisibility, Prisma } from "@prisma/client";
import {
  SearchTeamsDto,
  UpdateTeamProfileDto,
} from "./dto";
import { UpsertTeamGameProfileDto } from "./dto/upsert-team-game-profile.dto";
import { normalizeRegion } from "../../common/region-normalizer";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    user: {
      select: {
        id: true,
        email: true,
      },
    },
    teamGameProfiles: {
      include: {
        game: true,
        primaryRole: true,
      },
    },
    openPositions: {
      include: {
        game: true,
        role: true,
      },
    },
  };


  // --- Team per ID (öffentlich) ---

  async findById(id: string) {
    const team = await this.prisma.teamProfile.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!team) {
      throw new NotFoundException("Teamprofil nicht gefunden");
    }

    // Alias, damit das Frontend weiter `gameProfiles` benutzen kann
    return {
      ...team,
      gameProfiles: (team as any).teamGameProfiles ?? [],
    };
  }


  // --- Team des aktuellen Users (Owner) ---

    async findMyTeams(userId: string) {
      const team = await this.prisma.teamProfile.findUnique({
        where: { userId },
        include: this.defaultInclude,
      });

      if (!team) {
        throw new NotFoundException(
          "Für diesen User existiert noch kein Teamprofil",
        );
      }

      return {
        ...team,
        gameProfiles: (team as any).teamGameProfiles ?? [],
      };
    }


  // --- Team-Profil des aktuellen Users aktualisieren (/teams/me) ---

  async updateMyTeamProfile(userId: string, dto: UpdateTeamProfileDto) {
    const team = await this.prisma.teamProfile.findUnique({
      where: { userId },
    });

    if (!team) {
      throw new NotFoundException(
        "Für diesen User existiert noch kein Teamprofil",
      );
    }

    return this.prisma.teamProfile.update({
      where: { id: team.id },
      data: {
        name: dto.name ?? team.name,
        tag: dto.tag ?? team.tag,
        region: normalizeRegion(dto.region),
        bio: dto.bio ?? team.bio,
        isPro:
          typeof dto.isPro === "boolean" ? dto.isPro : team.isPro,
        visibility: dto.visibility ?? team.visibility,
        level: dto.level ?? team.level,
      },
      include: this.defaultInclude,
    });
  }

  // --- Game-Profile (pro Spiel) für ein Team upserten ---

  /**
   * Upsert der Game-Profile eines Teams.
   * Aktuell einfacher Ansatz:
   * - Berechtigungscheck: gehört das Team dem aktuellen User?
   * - Bestehende Profile löschen
   * - Neue aus dtos anlegen
   */
  async upsertTeamGameProfiles(
    teamId: string,
    userId: string,
    dtos: UpsertTeamGameProfileDto[],
  ) {
    // 1) Team holen und Ownership checken
    const team = await this.prisma.teamProfile.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (team.userId !== userId) {
      throw new ForbiddenException("Not the owner of this team");
    }

    // 2) Bisherige offenen Rollen löschen und neu anlegen
    await this.prisma.$transaction([
      this.prisma.teamGameProfile.deleteMany({
        where: { teamId },
      }),
      ...dtos
        .filter((dto) => dto.gameId) // nur Einträge mit Spiel-ID nehmen
        .map((dto) =>
          this.prisma.teamGameProfile.create({
            data: {
              teamId,
              gameId: dto.gameId, // Achtung: hier String, passt zu deinem Model
              primaryRoleId: dto.primaryRoleId ?? null,
              rank: dto.rank ?? null,
            },
          }),
        ),
    ]);

    // Optional: aktualisiertes Team zurückgeben
    return this.prisma.teamProfile.findUnique({
      where: { id: teamId },
      include: {
        teamGameProfiles: {
          include: { game: true, primaryRole: true },
        },
      },
    });
  }

  // --- Team-Suche (Filter wie bei Spielern) ---

  async searchTeams(dto: SearchTeamsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const where: Prisma.TeamProfileWhereInput = {
      visibility: ProfileVisibility.PUBLIC,
    };

    if (dto.region) {
      where.region = dto.region;
    }

    if (typeof dto.isPro === "boolean") {
      where.isPro = dto.isPro;
    }

    if (dto.level) {
      where.level = dto.level;
    }

    if (dto.gameId || dto.roleId) {
      // Filter: Team hat mindestens ein GameProfile zu diesem Spiel
      // und optional mit bestimmter Rolle
      (where as any).teamGameProfiles = {
        some: {
          ...(dto.gameId ? { gameId: dto.gameId } : {}),
          ...(dto.roleId ? { primaryRoleId: dto.roleId } : {}),
        },
      };
    }



    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: "insensitive" } },
        { tag: { contains: dto.q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.teamProfile.count({ where }),
      this.prisma.teamProfile.findMany({
        where,
        include: this.defaultInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
