// prisma/seed.ts
// Seed-Skript zum Initialbefüllen der Datenbank

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedLol() {
  const lol = await prisma.game.upsert({
    where: { code: "LOL" },
    update: {},
    create: {
      code: "LOL",
      name: "League of Legends",
    },
  });

  const lolRoles = [
    { code: "Top", name: "Top" },
    { code: "JUNGLE", name: "Jungle" },
    { code: "MID", name: "Mid" },
    { code: "ADC", name: "Bot / ADC" },
    { code: "SUPPORT", name: "Support" },
  ];

  for (const role of lolRoles) {
    await prisma.gameRole.upsert({
      where: {
        gameId_code: {
          gameId: lol.id,
          code: role.code,
        },
      },
      update: {},
      create: {
        gameId: lol.id,
        code: role.code,
        name: role.name,
      },
    });
  }

  const lolRanks = [
    { code: "IRON", name: "Iron", sortOrder: 1 },
    { code: "BRONZE", name: "Bronze", sortOrder: 2 },
    { code: "SILVER", name: "Silver", sortOrder: 3 },
    { code: "GOLD", name: "Gold", sortOrder: 4 },
    { code: "PLATINUM", name: "Platinum", sortOrder: 5 },
    { code: "EMERALD", name: "Emerald", sortOrder: 6 },
    { code: "DIAMOND", name: "Diamond", sortOrder: 7 },
    { code: "MASTER", name: "Master", sortOrder: 8 },
    { code: "GRANDMASTER", name: "Grandmaster", sortOrder: 9 },
    { code: "CHALLENGER", name: "Challenger", sortOrder: 10 },
  ];

  for (const rank of lolRanks) {
    // Stabile ID aus Game-Code + Rank-Code bauen
    const rankId = `LOL_${rank.code}`;

    await prisma.gameRank.upsert({
      where: {
        id: rankId,
      },
      update: {},
      create: {
        id: rankId,
        gameId: lol.id,
        code: rank.code,
        name: rank.name,
        sortOrder: rank.sortOrder,
        // roleId lassen wir weg -> null in DB, aber TS meckert nicht
      },
    });
  }
}


async function seedValorant() {
  const val = await prisma.game.upsert({
    where: { code: "VAL" },
    update: {},
    create: {
      code: "VAL",
      name: "VALORANT",
    },
  });

  const valRoles = [
    { code: "DUELIST", name: "Duelist" },
    { code: "INITIATOR", name: "Initiator" },
    { code: "CONTROLLER", name: "Controller" },
    { code: "SENTINEL", name: "Sentinel" },
  ];

  for (const role of valRoles) {
    await prisma.gameRole.upsert({
      where: {
        gameId_code: {
          gameId: val.id,
          code: role.code,
        },
      },
      update: {},
      create: {
        gameId: val.id,
        code: role.code,
        name: role.name,
      },
    });
  }

  const valRanks = [
    { code: "IRON", name: "Iron", sortOrder: 1 },
    { code: "BRONZE", name: "Bronze", sortOrder: 2 },
    { code: "SILVER", name: "Silver", sortOrder: 3 },
    { code: "GOLD", name: "Gold", sortOrder: 4 },
    { code: "PLATINUM", name: "Platinum", sortOrder: 5 },
    { code: "DIAMOND", name: "Diamond", sortOrder: 6 },
    { code: "ASCENDANT", name: "Ascendant", sortOrder: 7 },
    { code: "IMMORTAL", name: "Immortal", sortOrder: 8 },
    { code: "RADIANT", name: "Radiant", sortOrder: 9 },
  ];

  for (const rank of valRanks) {
    const rankId = `VAL_${rank.code}`;

    await prisma.gameRank.upsert({
      where: {
        id: rankId,
      },
      update: {},
      create: {
        id: rankId,
        gameId: val.id,
        code: rank.code,
        name: rank.name,
        sortOrder: rank.sortOrder,
      },
    });
  }
}

async function seedCs2() {
  const cs2 = await prisma.game.upsert({
    where: { code: "CS2" },
    update: {},
    create: {
      code: "CS2",
      name: "Counter-Strike 2",
    },
  });

  const cs2Roles = [
    { code: "IGL", name: "In-Game Leader" },
    { code: "ENTRY", name: "Entry" },
    { code: "AWP", name: "AWP" },
    { code: "SUPPORT", name: "Support" },
    { code: "LURKER", name: "Lurker" },
  ];

  for (const role of cs2Roles) {
    await prisma.gameRole.upsert({
      where: { gameId_code: { gameId: cs2.id, code: role.code }},
      update: {},
      create: {
        gameId: cs2.id,
        code: role.code,
        name: role.name,
      },
    });
  }

  const cs2Ranks = [
    { code: "S1", name: "Silver I", sortOrder: 1 },
    { code: "S2", name: "Silver II", sortOrder: 2 },
    { code: "GN1", name: "Gold Nova I", sortOrder: 3 },
    { code: "GN2", name: "Gold Nova II", sortOrder: 4 },
    { code: "MG1", name: "Master Guardian I", sortOrder: 5 },
    { code: "LE", name: "Legendary Eagle", sortOrder: 6 },
    { code: "LEM", name: "Legendary Eagle Master", sortOrder: 7 },
    { code: "SUPREME", name: "Supreme", sortOrder: 8 },
    { code: "GE", name: "Global Elite", sortOrder: 9 },
  ];

  for (const rank of cs2Ranks) {
    const rankId = `CS2_${rank.code}`;

    await prisma.gameRank.upsert({
      where: {
        id: rankId,
      },
      update: {},
      create: {
        id: rankId,
        gameId: cs2.id,
        code: rank.code,
        name: rank.name,
        sortOrder: rank.sortOrder,
      },
    });
  }
}


async function main() {
  console.log("Start seeding ...");

  await seedLol();
  await seedValorant();
  await seedCs2();
  
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
