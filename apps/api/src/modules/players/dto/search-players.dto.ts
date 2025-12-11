import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Query-DTO für die Spielersuche.
 * Diese Felder werden über die Query-Parameter von /players & /players/search gesetzt.
 */
export class SearchPlayersDto {
  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  /**
   * Region – z.B. "EUW", "EUNE", "NA"
   * Kommt aus dem Dropdown wie im Player-Profil.
   */
  @IsOptional()
  @IsString()
  region?: string;

  /**
   * Sprache – z.B. "de", "en"
   * Muss in der languages-Array des Profils enthalten sein.
   */
  @IsOptional()
  @IsString()
  language?: string;

  /**
   * Rank / Elo – z.B. "Diamond", "Gold", "Challenger".
   * Kommt aus dem Level/Ambition-Rank-Dropdown in der Spielersuche.
   */
  @IsOptional()
  @IsString()
  rank?: string;

  /**
   * Optionaler Pro-Flag (wenn du ihn später zusätzlich verwenden willst).
   * Der Level/Ambitions-Filter im Frontend nutzt aber primär "rank".
   */
  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  /**
   * Freitext-Suche über Displayname & E-Mail.
   */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 20;
}
