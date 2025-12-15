import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdatePlayerProfileDto } from "./dto/update-player-profile.dto";

// Die Controller rufen exakt diese Methoden auf.
// Wir implementieren sie so, dass sie zu deinem bestehenden API-Vertrag passen.

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  // --------- Helper ---------

  private includeForProfile() {
    return {
      gameProfiles: {
        include: {
          game: true,
          primaryRole: true,
        },
      },
    };
  }

  private async getProfileByUserIdOrThrow(userId: string) {
    const profile = await (this.prisma as any).playerProfile.findUnique({
      where: { userId },
      include: this.includeForProfile(),
    });
    if (!profile) throw new NotFoundException("Spielerprofil nicht gefunden.");
    return profile;
  }

  private async getProfileByIdOrThrow(id: string) {
    const profile = await (this.prisma as any).playerProfile.findUnique({
      where: { id },
      include: this.includeForProfile(),
    });
    if (!profile) throw new NotFoundException("Spieler nicht gefunden.");
    return profile;
  }

  // --------- Controller contract ---------

  // GET /players/me
  async getMyProfile(userId: string) {
    return this.getProfileByUserIdOrThrow(userId);
  }

  // PATCH/PUT /players/me
  async updateProfileByUserId(userId: string, dto: UpdatePlayerProfileDto) {
    await this.getProfileByUserIdOrThrow(userId);

    return (this.prisma as any).playerProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        region: dto.region ?? undefined,
        timezone: dto.timezone ?? undefined,
        languages: dto.languages ?? undefined,
        availability: dto.availability ?? undefined,
        bio: dto.bio ?? undefined,
        isPro: dto.isPro ?? undefined,
        visibility: dto.visibility ?? undefined,
        profileImageKey: dto.profileImageKey === undefined ? undefined : dto.profileImageKey,
      },
      include: this.includeForProfile(),
    });
  }

  // PUT /players/me/games (oder ähnlich)
  async upsertGameProfilesByUserId(userId: string, dtos: any[]) {
    const profile = await this.getProfileByUserIdOrThrow(userId);
    return this.upsertPlayerGameProfiles(profile.id, dtos);
  }

// GET /players/search
async searchPlayers(query: any) {
  const q = (query?.q ?? query?.query ?? "").toString().trim();
  const region = (query?.region ?? "").toString().trim();
  const gameId = (query?.gameId ?? "").toString().trim();

  const page = Math.max(1, parseInt(query?.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(query?.pageSize ?? "20", 10) || 20),
  );
  const skip = (page - 1) * pageSize;

  const where: any = {
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { bio: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(region ? { region } : {}),
    ...(gameId
      ? {
          // ⚠️ Wenn dein Schema anders heißt, hier anpassen:
          // häufig: playerGameProfiles statt gameProfiles
          gameProfiles: { some: { gameId } },
        }
      : {}),
    visibility: "PUBLIC",
  };

  const [total, items] = await Promise.all([
    (this.prisma as any).playerProfile.count({ where }),
    (this.prisma as any).playerProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: this.includeForProfile?.() ?? undefined,
      skip,
      take: pageSize,
    }),
  ]);

  return { items, total, page, pageSize };
}

  // GET /players/user/:userId
  async findByUserId(userId: string) {
    return this.getProfileByUserIdOrThrow(userId);
  }

  // GET /players/:id
  async findById(id: string) {
    return this.getProfileByIdOrThrow(id);
  }

  // PATCH/PUT /players/:id (Admin oder intern)
  async updateProfile(id: string, dto: UpdatePlayerProfileDto) {
    await this.getProfileByIdOrThrow(id);

    return (this.prisma as any).playerProfile.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        region: dto.region ?? undefined,
        timezone: dto.timezone ?? undefined,
        languages: dto.languages ?? undefined,
        availability: dto.availability ?? undefined,
        bio: dto.bio ?? undefined,
        isPro: dto.isPro ?? undefined,
        visibility: dto.visibility ?? undefined,
        profileImageKey: dto.profileImageKey === undefined ? undefined : dto.profileImageKey,
      },
      include: this.includeForProfile(),
    });
  }

  // PUT /players/:id/games
  async upsertPlayerGameProfiles(playerProfileId: string, dtos: any[]) {
    const profile = await this.getProfileByIdOrThrow(playerProfileId);

    // dtos erwartet typischerweise: [{ id?, gameId, primaryRoleId?, rank? }, ...]
    // Wir machen es robust: "replace all" (einfach & stabil)
    return this.prisma.$transaction(async (tx) => {
      await (tx as any).playerGameProfile.deleteMany({
        where: { playerProfileId: profile.id },
      });

      if (Array.isArray(dtos) && dtos.length > 0) {
        await (tx as any).playerGameProfile.createMany({
          data: dtos
            .filter((d) => d && d.gameId)
            .map((d) => ({
              playerProfileId: profile.id,
              gameId: d.gameId,
              primaryRoleId: d.primaryRoleId ?? null,
              rank: d.rank ?? null,
            })),
        });
      }

      return (tx as any).playerProfile.findUnique({
        where: { id: profile.id },
        include: this.includeForProfile(),
      });
    });
  }
}
