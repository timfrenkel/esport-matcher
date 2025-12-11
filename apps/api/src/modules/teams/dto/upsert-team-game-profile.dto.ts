import { IsUUID, IsOptional, IsString } from "class-validator";

export class UpsertTeamGameProfileDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  gameId!: string;

  // Primäre Rolle des Teams in diesem Spiel
  @IsUUID()
  @IsOptional()
  primaryRoleId?: string | null;

  // Rank / Elo des Teams (z. B. "Diamond", "Immortal")
  @IsString()
  @IsOptional()
  rank?: string | null;

  // Team-Level / Ambition in diesem Spiel (z. B. "pro", "semi", "amateur")
  @IsString()
  @IsOptional()
  level?: string | null;
}
