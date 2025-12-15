import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdateTeamProfileDto } from "./dto/update-team-profile.dto";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  private includeForTeam() {
    return {
      teamGameProfiles: {
        include: {
          game: true,
          primaryRole: true,
        },
      },
      openPositions: true,
    };
  }

  private async getTeamByIdOrThrow(id: string) {
    const team = await this.prisma.teamProfile.findUnique({
      where: { id },
      include: this.includeForTeam(),
    });
    if (!team) throw new NotFoundException("Team nicht gefunden.");
    return team;
  }

  private async getMyTeamOrThrow(userId: string) {
    const team = await this.prisma.teamProfile.findUnique({
      where: { userId },
      include: this.includeForTeam(),
    });
    if (!team) throw new NotFoundException("Teamprofil nicht gefunden.");
    return team;
  }

  // GET /teams (paginiert)
  async searchTeams(query: any) {
    const q = (query?.q ?? "").toString().trim();
    const region = (query?.region ?? "").toString().trim();
    const gameId = (query?.gameId ?? "").toString().trim();
    const roleId = (query?.roleId ?? "").toString().trim();
    const level = (query?.level ?? "").toString().trim();
    const isPro =
      typeof query?.isPro === "string"
        ? query.isPro === "true"
        : typeof query?.isPro === "boolean"
          ? query.isPro
          : undefined;

    const page = Math.max(1, parseInt(query?.page ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query?.pageSize ?? "20", 10) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tag: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(region ? { region } : {}),
      ...(typeof isPro === "boolean" ? { isPro } : {}),
      ...(level ? { level } : {}),
      visibility: "PUBLIC",
      ...(gameId
        ? {
            teamGameProfiles: { some: { gameId } },
          }
        : {}),
      ...(roleId
        ? {
            teamGameProfiles: { some: { primaryRoleId: roleId } },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.teamProfile.count({ where }),
      this.prisma.teamProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: this.includeForTeam(),
        skip,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  // GET /teams/me  (WICHTIG: kein Array)
  async findMyTeams(userId: string) {
    return this.getMyTeamOrThrow(userId);
  }

  // GET /teams/:id
  async findById(id: string) {
    return this.getTeamByIdOrThrow(id);
  }

  // PUT /teams/me
  async updateMyTeamProfile(userId: string, dto: UpdateTeamProfileDto) {
    await this.getMyTeamOrThrow(userId);

    return this.prisma.teamProfile.update({
      where: { userId },
      data: {
        name: dto.name ?? undefined,
        tag: dto.tag ?? undefined,
        region: dto.region ?? undefined,
        isPro: typeof dto.isPro === "boolean" ? dto.isPro : undefined,
        bio: dto.bio ?? undefined,
        description: (dto as any).description ?? undefined,
        visibility: (dto as any).visibility ?? undefined,
        level: (dto as any).level ?? undefined,

        profileImageKey: dto.profileImageKey === null ? null : dto.profileImageKey ?? undefined,
        bannerImageKey: dto.bannerImageKey === null ? null : dto.bannerImageKey ?? undefined,
      },
      include: this.includeForTeam(),
    });
  }

  // PUT /teams/:id/games
  async upsertTeamGameProfiles(teamId: string, userId: string, dtos: any[]) {
    const team = await this.prisma.teamProfile.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException("Team nicht gefunden.");
    if (team.userId !== userId) throw new ForbiddenException("Du darfst dieses Team nicht bearbeiten.");

    // replace-all (einfach & robust)
    await this.prisma.$transaction(async (tx) => {
      await tx.teamGameProfile.deleteMany({ where: { teamId } });

      const rows = (Array.isArray(dtos) ? dtos : [])
        .filter((d) => d && d.gameId)
        .map((d) => ({
          teamId,
          gameId: d.gameId,
          primaryRoleId: d.primaryRoleId ?? null,
          rank: d.rank ?? null,
          competitiveLevel: d.level ?? d.competitiveLevel ?? null, // frontend sendet "level"
        }));

      if (rows.length > 0) {
        await tx.teamGameProfile.createMany({ data: rows });
      }
    });

    return this.getTeamByIdOrThrow(teamId);
  }
}
