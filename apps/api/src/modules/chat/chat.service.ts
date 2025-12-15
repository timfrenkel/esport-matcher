import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { ChatGateway } from "./chat.gateway";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService, private readonly chatGateway: ChatGateway,) {}

  private async assertUserIsParticipant(userId: string, conversationId: string) {
    const conv = await (this.prisma as any).conversation.findUnique({
      where: { id: conversationId },
      include: {
        contactRequest: true,
      },
    });

    if (!conv) throw new NotFoundException("Chat nicht gefunden.");

    const { fromUserId, toUserId } = conv.contactRequest;
    if (userId !== fromUserId && userId !== toUserId) {
      throw new ForbiddenException("Du hast keinen Zugriff auf diesen Chat.");
    }

    return conv;
  }

  async listMyChats(userId: string) {
    // Alle Conversations, bei denen ich in der zugrunde liegenden ContactRequest beteiligt bin
    return (this.prisma as any).conversation.findMany({
      where: {
        contactRequest: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      },
      include: {
        contactRequest: {
          include: {
            game: true,
            fromUser: true,
            toUser: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // preview/last message
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listMessages(userId: string, conversationId: string) {
    await this.assertUserIsParticipant(userId, conversationId);

    return (this.prisma as any).message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.assertUserIsParticipant(userId, conversationId);

    const msg = await (this.prisma as any).message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
      },
    });
    this.chatGateway.emitNewMessage(conversationId, msg);
    // Damit Chats in der Inbox nach neuer Nachricht oben landen:
    await (this.prisma as any).conversation.update({
      where: { id: conversationId },
      data: {}, // updatedAt bump durch @updatedAt
    });

    return msg;
  }
}
