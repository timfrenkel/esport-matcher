import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../database/prisma.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, ChatGateway],
})
export class ChatModule {}
