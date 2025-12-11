import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TeamsService } from "./teams.service";
import {
  SearchTeamsDto,
  UpdateTeamProfileDto,
  UpsertTeamGameProfileDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/currentuser.decorator";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // GET /api/teams?gameCode=LOL&region=EUW&level=...
  @Get()
  async search(@Query() query: SearchTeamsDto) {
    return this.teamsService.searchTeams(query);
  }

  // GET /api/teams/me (Team des aktuell eingeloggten Users)
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMyTeam(@CurrentUser() user: CurrentUserPayload) {
    return this.teamsService.findMyTeams(user.sub);
  }

  // GET /api/teams/:id (öffentlich)
  @Get(":id")
  findById(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    return this.teamsService.findById(id);
  }

  // PUT /api/teams/me (Stammdaten des eigenen Teams bearbeiten)
  @UseGuards(JwtAuthGuard)
  @Put("me")
  updateMyTeam(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateTeamProfileDto,
  ) {
    return this.teamsService.updateMyTeamProfile(user.sub, dto);
  }

  // PUT /api/teams/:id/games (Game-Profile eines Teams pflegen)
  @UseGuards(JwtAuthGuard)
  @Put(":id/games")
  upsertTeamGames(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dtos: UpsertTeamGameProfileDto[],
  ) {
    return this.teamsService.upsertTeamGameProfiles(id, user.sub, dtos);
  }
}
