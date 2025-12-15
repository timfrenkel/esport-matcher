import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const gameId = "c2b44f6a-50b0-4d83-8e3e-80d1654c7fea";

  // gameId ist inzwischen required -> es sollte keine NULLs mehr geben.
  // Wir casten hier absichtlich, damit das Script "legacy safe" bleibt.
  const result = await (prisma as any).contactRequest.updateMany({
    where: { gameId: null },
    data: { gameId },
  });

  console.log("Updated rows:", result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
