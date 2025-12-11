import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../database/prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "7d") as any;

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: jwtExpiresIn
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule]
})
export class AuthModule {}
