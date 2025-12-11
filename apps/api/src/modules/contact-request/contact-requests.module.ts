import { Module } from "@nestjs/common";
import { ContactRequestsService } from "./contact-requests.service";
import { ContactRequestsController } from "./contact-requests.controller";
import { PrismaService } from "../database/prisma.service";

@Module({
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService, PrismaService],
})
export class ContactRequestsModule {}
