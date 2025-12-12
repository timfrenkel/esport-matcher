import { Controller, Get, Param, Query } from "@nestjs/common";
import { GamesService } from "./games.service";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  /**
   * GET /games
   * Liefert alle Spiele (für Dropdowns etc.)
   */
  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  /**
   * GET /games/:id
   * Liefert ein einzelnes Spiel nach ID
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gamesService.findOne(id);
  }

  /**
   * GET /games/:id/roles
   * Liefert alle Rollen für ein Spiel (GameRole)
   */
  @Get(":id/roles")
  findRoles(@Param("id") id: string) {
    return this.gamesService.findRolesForGame(id);
  }


  @Get(":id/ranks")
  getRanksForGame(
    @Param("id") id: string,
    @Query("roleId") roleId?: string,
  ) {
    return this.gamesService.getRanksForGame(id, roleId);
  }
}