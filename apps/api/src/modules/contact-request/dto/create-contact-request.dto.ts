import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateContactRequestDto {
  @IsUUID()
  gameId!: string;

  @IsOptional()
  @IsUUID()
  targetPlayerId?: string;

  @IsOptional()
  @IsUUID()
  targetTeamId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
