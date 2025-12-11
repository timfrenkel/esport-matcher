import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/currentuser.decorator";

@UseGuards(JwtAuthGuard)
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // --------------------------------------------------
  // 1) Teams für einen bestimmten Spieler
  //    GET /api/matching/teams-for-player/:playerId
  // --------------------------------------------------
  @Get("teams-for-player/:playerId")
  getTeamsForPlayer(@Param("playerId") playerId: string) {
    return this.matchingService.getTeamsForPlayer(playerId);
  }

  // --------------------------------------------------
  // 2) Spieler für ein bestimmtes Team
  //    GET /api/matching/players-for-team/:teamId
  // --------------------------------------------------
  @Get("players-for-team/:teamId")
  getPlayersForTeam(@Param("teamId") teamId: string) {
    return this.matchingService.getPlayersForTeam(teamId);
  }

  // --------------------------------------------------
  // 3) Teams für MICH (aktueller User mit PlayerProfile)
  //    GET /api/matching/teams-for-me
  // --------------------------------------------------
  @Get("teams-for-me")
  getTeamsForMe(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.getTeamsForCurrentUser(user.sub);
  }

  // --------------------------------------------------
  // 4) Spieler für MICH (aktueller User mit TeamProfile)
  //    GET /api/matching/players-for-me
  // --------------------------------------------------
  @Get("players-for-me")
  getPlayersForMe(@CurrentUser() user: CurrentUserPayload) {
    return this.matchingService.getPlayersForCurrentUser(user.sub);
  }
}
