import {
  Body,
  Query,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { UpdatePlayerProfileDto } from "./dto/update-player-profile.dto";
import { UpsertPlayerGameProfileDto } from "./dto/upsert-player-game-profile.dto";
import { PlayersService } from "./players.service";
import { SearchPlayersDto } from "./dto/search-players.dto";

// HIER: korrekter Pfad zu deinem Auth-Guard
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

// HIER: korrekter Pfad zu deinem CurrentUser-Decorator
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/currentuser.decorator";

@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // ---------------------------------
  // 1) Authentifizierte "me"-Endpunkte
  // ---------------------------------

  // GET /api/players/me
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() user: CurrentUserPayload) {
    // nutzt die Logik, die bei Bedarf ein Profil anlegt
    return this.playersService.getMyProfile(user.sub);
  }

  // PUT /api/players/me
  @UseGuards(JwtAuthGuard)
  @Put("me")
  updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePlayerProfileDto,
  ) {
    return this.playersService.updateProfileByUserId(user.sub, dto);
  }

  // PUT /api/players/me/games
  @UseGuards(JwtAuthGuard)
  @Put("me/games")
  upsertMyGameProfiles(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dtos: UpsertPlayerGameProfileDto[],
  ) {
    return this.playersService.upsertGameProfilesByUserId(user.sub, dtos);
  }

  // ---------------------------------
  // 2) Öffentliche / Such-Endpunkte
  // ---------------------------------

  // GET /api/players/search  (für die Listing-Seite)
  @Get("search")
  searchPlayers(@Query() query: SearchPlayersDto) {
    return this.playersService.searchPlayers(query);
  }

  // GET /api/players (wenn du später eine einfache Liste brauchst)
  @Get()
  async search(@Query() query: SearchPlayersDto) {
    return this.playersService.searchPlayers(query);
  }

  // GET /api/players/by-user/:userId
  @Get("by-user/:userId")
  findByUserId(@Param("userId") userId: string) {
    return this.playersService.findByUserId(userId);
  }

  // GET /api/players/:id (öffentliche Player-Profilseite)
  // >>> WICHTIG: Kein ParseUUIDPipe mehr, damit "Validation failed (uuid v 4 is expected)" weg ist
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.playersService.findById(id);
  }

  // PUT /api/players/:id (falls du später Admin-Funktionen brauchst)
  @Put(":id")
  updateProfile(
    @Param("id") id: string,
    @Body() dto: UpdatePlayerProfileDto,
  ) {
    return this.playersService.updateProfile(id, dto);
  }

  // PUT /api/players/:id/games
  // Wird aktuell vom Frontend nicht verwendet, lassen wir aber für Vollständigkeit drin
  @Put(":id/games")
  upsertGameProfiles(
    @Param("id") id: string,
    @Body() dtos: UpsertPlayerGameProfileDto[],
  ) {
    return this.playersService.upsertPlayerGameProfiles(id, dtos);
  }
}
