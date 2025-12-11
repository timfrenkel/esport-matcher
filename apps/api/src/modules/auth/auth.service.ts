import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ProfileVisibility, UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Mappt "player" | "team" aus dem DTO auf das Prisma-Enum UserRole.
   */
  private mapRoleToUserRole(role: "player" | "team"): UserRole {
    return role === "team" ? UserRole.TEAM : UserRole.PLAYER;
  }

  private buildTokenPayload(user: {
    id: string;
    email: string;
    role: UserRole;
  }) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const prismaRole = this.mapRoleToUserRole(dto.role);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        // Feld in Prisma heißt jetzt "password"
        password: passwordHash,
        role: prismaRole, 
        // Standard: Spielerprofil
        playerProfile:
          dto.role === "player"
            ? {
                create: {
                  displayName: dto.email.split("@")[0],
                  isPro: false,
                  visibility: ProfileVisibility.PUBLIC,
                },
              }
            : undefined,
        // Standard: Teamprofil
        teamProfile:
          dto.role === "team"
            ? {
                create: {
                  name: dto.teamName ?? dto.email.split("@")[0],
                  tag: dto.teamTag ?? null,
                  region: null,
                  bio: null,
                  isPro: false,
                  visibility: ProfileVisibility.PUBLIC,
                  level: "CASUAL",
                },
              }
            : undefined,
      },
    });

    const payload = this.buildTokenPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      userId: user.id,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    // 1) User per E-Mail holen
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2) Wenn User nicht existiert -> 401
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // 3) Passwort prüfen
    const isValid = await bcrypt.compare(dto.password, user.password);


    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // 4) JWT bauen
    const payload = this.buildTokenPayload(user);
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}