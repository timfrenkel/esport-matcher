import { Module } from "@nestjs/common";
import { PlayersService } from "./players.service";
import { PlayersController } from "./players.controller";
import { PrismaService } from "../database/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule // bringt JwtModule / JwtService in den Kontext
  ],
  controllers: [PlayersController],
  providers: [PlayersService, PrismaService],
  exports: [PlayersService]
})
export class PlayersModule {}
