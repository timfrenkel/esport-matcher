import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { DatabaseModule } from "./modules/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GamesModule } from "./modules/games/games.module";
import { PlayersModule } from "./modules/players/players.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { MatchingModule } from "./modules/matching/matching.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    GamesModule,
    PlayersModule,
    TeamsModule,
    HealthModule,
    MatchingModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
