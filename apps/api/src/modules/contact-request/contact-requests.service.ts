// apps/api/src/modules/contact-request/contact-requests.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import {
  ContactRequestStatus,
  UpdateContactRequestStatusDto,
} from "./dto/update-contact-request-status.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class ContactRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactRequestDto) {
    const { targetPlayerId, targetTeamId, message } = dto;

    if (!!targetPlayerId === !!targetTeamId) {
      throw new BadRequestException(
        "Entweder targetPlayerId oder targetTeamId muss gesetzt sein.",
      );
    }

    // Aktuellen User laden (inkl. Profil)
    const fromUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        playerProfile: true,
        teamProfile: true,
      },
    });

    if (!fromUser) {
      throw new NotFoundException("User not found");
    }

    // Ziel bestimmen
    let toUserId: string;
    let targetPlayer: any = null;
    let targetTeam: any = null;

    if (targetPlayerId) {
      targetPlayer = await this.prisma.playerProfile.findUnique({
        where: { id: targetPlayerId },
        include: { user: true },
      });

      if (!targetPlayer || targetPlayer.visibility !== "PUBLIC") {
        throw new NotFoundException("Ziel-Spielerprofil nicht gefunden.");
      }

      toUserId = targetPlayer.userId;
    } else {
      targetTeam = await this.prisma.teamProfile.findUnique({
        where: { id: targetTeamId! },
        include: { user: true },
      });

      if (!targetTeam || targetTeam.visibility !== "PUBLIC") {
        throw new NotFoundException("Ziel-Teamprofil nicht gefunden.");
      }

      toUserId = targetTeam.userId;
    }

    if (toUserId === userId) {
      throw new BadRequestException(
        "Du kannst dir selbst keine Kontaktanfrage schicken.",
      );
    }

    // doppelte PENDING-Anfragen verhindern
    const existing = await (this.prisma as any).contactRequest.findFirst({
      where: {
        fromUserId: userId,
        toUserId,
        status: "PENDING",
        targetPlayerId: targetPlayerId ?? undefined,
        targetTeamId: targetTeamId ?? undefined,
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Es existiert bereits eine offene Anfrage an dieses Profil.",
      );
    }

    const created = await (this.prisma as any).contactRequest.create({
      data: {
        fromUserId: userId,
        toUserId,
        targetPlayerId: targetPlayerId ?? null,
        targetTeamId: targetTeamId ?? null,
        message: message ?? null,
      },
    });

    return this.mapToSummary(created, fromUser.role, {
      fromUser,
      targetPlayer,
      targetTeam,
      direction: "OUTGOING",
    });
  }

  async getIncoming(userId: string) {
    const items = await (this.prisma as any).contactRequest.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: {
          include: {
            playerProfile: true,
            teamProfile: true,
          },
        },
        targetPlayer: true,
        targetTeam: true,
      },
    });

    return items.map((item: any) =>
      this.mapToSummary(item, item.fromUser.role, {
        fromUser: item.fromUser,
        targetPlayer: item.targetPlayer,
        targetTeam: item.targetTeam,
        direction: "INCOMING",
      }),
    );
  }

  async getOutgoing(userId: string) {
    const items = await (this.prisma as any).contactRequest.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        toUser: {
          include: {
            playerProfile: true,
            teamProfile: true,
          },
        },
        targetPlayer: true,
        targetTeam: true,
      },
    });

    return items.map((item: any) =>
      this.mapToSummary(item, item.toUser.role, {
        fromUser: item.toUser, // aus Sicht des Gegenübers
        targetPlayer: item.targetPlayer,
        targetTeam: item.targetTeam,
        direction: "OUTGOING",
      }),
    );
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateContactRequestStatusDto,
  ) {
    const request = await (this.prisma as any).contactRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException("Kontaktanfrage nicht gefunden.");
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException("Du darfst diese Anfrage nicht bearbeiten.");
    }

    const updated = await (this.prisma as any).contactRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    return updated;
  }

  private mapToSummary(
    item: any,
    otherRole: UserRole,
    ctx: {
      fromUser: any;
      targetPlayer: any;
      targetTeam: any;
      direction: "INCOMING" | "OUTGOING";
    },
  ) {
    const { fromUser, targetPlayer, targetTeam, direction } = ctx;

    let otherType: "PLAYER" | "TEAM";
    let otherProfileId: string;
    let otherName: string;

    if (otherRole === "PLAYER" && fromUser.playerProfile) {
      otherType = "PLAYER";
      otherProfileId = fromUser.playerProfile.id;
      otherName = fromUser.playerProfile.displayName ?? "Spieler";
    } else if (otherRole === "TEAM" && fromUser.teamProfile) {
      otherType = "TEAM";
      otherProfileId = fromUser.teamProfile.id;
      otherName = fromUser.teamProfile.name ?? "Team";
    } else {
      otherType = otherRole as "PLAYER" | "TEAM";
      otherProfileId = fromUser.id;
      otherName = "Unbekannt";
    }

    return {
      id: item.id,
      createdAt: item.createdAt,
      status: item.status as ContactRequestStatus,
      message: item.message ?? null,
      direction,
      otherType,
      otherProfileId,
      otherName,
      target: targetPlayer
        ? {
            type: "PLAYER" as const,
            profileId: targetPlayer.id,
            name: targetPlayer.displayName ?? "Spieler",
          }
        : targetTeam
        ? {
            type: "TEAM" as const,
            profileId: targetTeam.id,
            name: targetTeam.name ?? "Team",
          }
        : null,
    };
  }
}
