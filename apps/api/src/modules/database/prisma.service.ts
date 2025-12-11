import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("[Prisma] Connected to database");
    } catch (err) {
      this.logger.error("[Prisma] Failed to connect to database", err as any);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
