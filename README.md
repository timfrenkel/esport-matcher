# Esport Matcher Monorepo

Dieses Repository enthält die komplette Codebasis für die Esport-Matching-Plattform:

- **Frontend**: `apps/web` (Next.js)
- **Backend API**: `apps/api` (NestJS)
- **Worker**: `apps/worker` (Background-Jobs, z.B. Media-Transcoding)
- **Shared Packages**: `packages/*` (z.B. Shared Types, ESLint-Config)
- **Infra**: `infra/*` (DB-Migrations, Deploy, Docker, etc.)

## Entwicklung

### Voraussetzungen

- Node.js >= 20
- npm >= 8 (für Workspaces)

### Erste Schritte

```bash
npm install
