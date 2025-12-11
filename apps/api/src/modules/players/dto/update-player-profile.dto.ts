import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

type ProfileVisibility = "PUBLIC" | "PRIVATE";

export class UpdatePlayerProfileDto {
  @IsString()
  @MaxLength(50)
  displayName!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsObject()
  availability?: any;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  @IsOptional()
  @IsEnum(["PUBLIC", "PRIVATE"], {
    message: "visibility must be PUBLIC or PRIVATE",
  })
  visibility?: ProfileVisibility;
}
