import { Module } from "@nestjs/common";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";
import { PrismaService } from "../database/prisma.service";
import { AuthModule } from "../auth/auth.module"; // 👈 wichtig: AuthModule importieren

@Module({
  imports: [
    AuthModule, // 👈 damit JwtService und JwtAuthGuard im Kontext verfügbar sind
  ],
  controllers: [MatchingController],
  providers: [MatchingService, PrismaService],
})
export class MatchingModule {}
