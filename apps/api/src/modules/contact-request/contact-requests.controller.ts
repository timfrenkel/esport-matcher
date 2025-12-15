import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ContactRequestsService } from "./contact-requests.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/currentuser.decorator";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestStatusDto } from "./dto/update-contact-request-status.dto";

@UseGuards(JwtAuthGuard)
@Controller("contact-requests")
export class ContactRequestsController {
  constructor(private readonly contactRequestsService: ContactRequestsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateContactRequestDto,
  ) {
    return this.contactRequestsService.create(user.sub, dto);
  }

  @Get("incoming")
  getIncoming(@CurrentUser() user: CurrentUserPayload) {
    return this.contactRequestsService.getIncoming(user.sub);
  }

  @Get("outgoing")
  getOutgoing(@CurrentUser() user: CurrentUserPayload) {
    return this.contactRequestsService.getOutgoing(user.sub);
  }

  @Patch(":id")
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateContactRequestStatusDto,
  ) {
    return this.contactRequestsService.updateStatus(user.sub, id, dto);
  }

  @Delete(":id")
  withdraw(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    return this.contactRequestsService.withdraw(user.sub, id);
  }
}
