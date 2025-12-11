import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  check() {
    // Hier können wir später DB- und Queue-Checks einbauen (Prisma, Redis, S3 etc.)
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}
