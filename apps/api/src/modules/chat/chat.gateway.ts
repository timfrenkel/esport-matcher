import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../database/prisma.service";

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    try {
      const payload = (await this.jwtService.verifyAsync(token)) as any;
      (client as any).userId = payload.sub;
    } catch {
      client.disconnect();
    }
    return;
  }

  @SubscribeMessage("conversation:join")
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = (client as any).userId as string | undefined;
    if (!userId) return { ok: false };

    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };

    // ✅ Teilnehmerprüfung (wichtig!)
    const conv = await (this.prisma as any).conversation.findUnique({
      where: { id: conversationId },
      include: { contactRequest: true },
    });

    if (!conv) return { ok: false };

    const { fromUserId, toUserId } = conv.contactRequest;
    if (userId !== fromUserId && userId !== toUserId) {
      return { ok: false };
    }

    client.join(conversationId);
    return { ok: true };
  }

  emitNewMessage(conversationId: string, message: any) {
    this.server.to(conversationId).emit("message:new", message);
  }
}
