import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class SearchTeamsDto {
  // Filter: Spiel (Game-ID)
  @IsOptional()
  @IsUUID()
  gameId?: string;

  // Filter: offene Rolle (GameRole-ID)
  @IsOptional()
  @IsUUID()
  roleId?: string;

  // Server / Region (z. B. "EUW", "NA", "DACH")
  @IsOptional()
  @IsString()
  region?: string;

  // Team-Level / Ambition (z. B. "CASUAL", "SEMI_COMP", "COMP", "PRO")
  @IsOptional()
  @IsString()
  level?: string;

  // Nur (semi-)pro Teams
  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  // Freitext (Teamname / Tag)
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
