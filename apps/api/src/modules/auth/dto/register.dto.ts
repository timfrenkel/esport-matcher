import { IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  email!: string;
  @IsNotEmpty()
  password!: string;

  /**
   * "player" oder "team" – kommt vom Frontend
   */
  @IsNotEmpty()
  @IsIn(['player', 'team'])
  role: "player" | "team" = "player";

  /**
   * Nur relevant, wenn role === "team"
   */
  teamName?: string;
  teamTag?: string;
}
