import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/currentuser.decorator";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("chats")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  listMyChats(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.listMyChats(user.sub);
  }

  @Get(":id/messages")
  listMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    return this.chatService.listMessages(user.sub, id);
  }

  @Post(":id/messages")
  sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.sub, id, dto);
  }
}
