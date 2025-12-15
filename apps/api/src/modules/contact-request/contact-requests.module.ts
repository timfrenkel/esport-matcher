import { Module } from "@nestjs/common";
import { ContactRequestsService } from "./contact-requests.service";
import { ContactRequestsController } from "./contact-requests.controller";
import { PrismaService } from "../database/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService, PrismaService],
})
export class ContactRequestsModule {}
