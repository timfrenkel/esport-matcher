import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ProfileVisibility } from "@prisma/client";

export class UpdateTeamProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  tag?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string | null;

  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string | null;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  level?: string;
}
