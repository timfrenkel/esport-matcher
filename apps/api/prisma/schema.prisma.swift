generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  TEAM_MANAGER
  ADMIN
}

enum ProfileVisibility {
  PUBLIC
  PRIVATE
}

enum TeamLevel {
  SEMI_COMPETITIVE
  NATIONAL
  INTERNATIONAL
  ACADEMY
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         UserRole @default(USER)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  playerProfile PlayerProfile?
  teamProfiles  TeamProfile[] @relation("TeamOwner")
}

model PlayerProfile {
  id        String  @id @default(cuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])

  displayName String
  region      String?
  timezone    String?
  languages   String[] // z.B. ["de", "en"]
  availability Json?   // JSON-Objekt mit Wochentagen & Zeitfenstern
  bio         String?
  isPro       Boolean           @default(false)
  visibility  ProfileVisibility @default(PUBLIC)

  gameProfiles    PlayerGameProfile[]
  teamMemberships TeamMember[]
  applications    Application[] @relation("PlayerApplications")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TeamProfile {
  id          String     @id @default(cuid())
  ownerUserId String
  owner       User       @relation("TeamOwner", fields: [ownerUserId], references: [id])

  name      String
  tag       String?
  region    String?
  timezone  String?
  languages String[]
  bio       String?

  level TeamLevel @default(SEMI_COMPETITIVE)
  isPro Boolean   @default(false)

  gameProfiles TeamGameProfile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerUserId])
}

model Game {
  id   Int    @id @default(autoincrement())
  name String
  code String @unique // z.B. LOL, VALORANT, CS2

  roles             GameRole[]
  playerGameConfigs PlayerGameProfile[]
  teamGameConfigs   TeamGameProfile[]
}

model GameRole {
  id     Int   @id @default(autoincrement())
  gameId Int
  game   Game  @relation(fields: [gameId], references: [id])

  name String
  code String // z.B. TOP, JG, IGL

  @@index([gameId])
}

model PlayerGameProfile {
  id               String         @id @default(cuid())
  playerProfileId  String
  playerProfile    PlayerProfile  @relation(fields: [playerProfileId], references: [id])

  gameId    Int
  game      Game           @relation(fields: [gameId], references: [id])
  mainRoles String[]       // IDs oder Codes der Rollen (vereinfachte Version)
  rankCurrent    String?
  rankPeak       String?
  experienceYears Int?     // Jahre Erfahrung
  lookingForRole String?   // Text/Rollen-Code
  lookingForTeam Boolean   @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([playerProfileId])
  @@index([gameId])
}

model TeamGameProfile {
  id             String        @id @default(cuid())
  teamProfileId  String
  teamProfile    TeamProfile   @relation(fields: [teamProfileId], references: [id])

  gameId Int
  game   Game         @relation(fields: [gameId], references: [id])

  level            TeamLevel @default(SEMI_COMPETITIVE)
  scrimSchedule    Json?     // JSON-Struktur für Scrim-Zeiten
  trainingSchedule Json?     // JSON für Trainingszeiten

  members       TeamMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teamProfileId])
  @@index([gameId])
}

model TeamMember {
  id                 String         @id @default(cuid())
  teamGameProfileId  String
  teamGameProfile    TeamGameProfile @relation(fields: [teamGameProfileId], references: [id])

  playerProfileId String
  playerProfile   PlayerProfile @relation(fields: [playerProfileId], references: [id])

  roleInGame String?
  status     String   @default("ACTIVE") // ACTIVE, TRIAL, BENCH etc.

  joinedAt DateTime @default(now())

  @@index([teamGameProfileId])
  @@index([playerProfileId])
}

model OpenPosition {
  id                String          @id @default(cuid())
  teamGameProfileId String
  teamGameProfile   TeamGameProfile @relation(fields: [teamGameProfileId], references: [id])

  role        String    // gesuchte Rolle (Code)
  minRank     String?
  maxRank     String?
  description String?
  isActive    Boolean   @default(true)

  applications Application[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teamGameProfileId])
}

model Application {
  id               String            @id @default(cuid())
  playerProfileId  String
  playerProfile    PlayerProfile     @relation("PlayerApplications", fields: [playerProfileId], references: [id])

  openPositionId String
  openPosition   OpenPosition @relation(fields: [openPositionId], references: [id])

  status  ApplicationStatus @default(PENDING)
  message String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([playerProfileId])
  @@index([openPositionId])
}
