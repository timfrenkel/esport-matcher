// Zentrale API-Helper + Typen
// ---------------------------------------

declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiFetchOptions = RequestInit & {
  /**
   * Wenn true, wird KEIN Authorization-Header gesetzt
   * (für /auth/login, /auth/register etc.).
   */
  skipAuth?: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function getAuthTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  // 1) Struktur wie { token, accessToken, role, ... } in "em_auth"
  const rawAuth = window.localStorage.getItem("em_auth");
  if (rawAuth) {
    try {
      const parsed = JSON.parse(rawAuth);
      if (typeof parsed.token === "string") return parsed.token;
      if (typeof parsed.accessToken === "string") return parsed.accessToken;
    } catch {
      // ignore JSON parse error
    }
  }

  // 2) einfache String-Keys als Fallback
  const simple =
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("token");
  if (simple) return simple;

  return null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  let token: string | null = null;
  if (!skipAuth) {
    token = getAuthTokenFromStorage();
  }

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (token && !skipAuth) {
    (finalHeaders as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status} on ${path}`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}

// ---------------------------------------
// Auth-Typen & Endpoints
// ---------------------------------------

export type UserRole = "PLAYER" | "TEAM" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface GameRankDto {
  id: string;
  gameId: string;
  code: string; // z. B. "DIAMOND"
  name: string; // z. B. "Diamond"
  sortOrder: number;
  roleId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string; // z. B. "PLAYER" | "TEAM"
  };
}

export async function apiRegister(params: {
  email: string;
  password: string;
  role: "player" | "team";
}) {
  return apiFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  });
}

export async function apiLogin(params: {
  email: string;
  password: string;
}) {
  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
    skipAuth: true,
  });

  if (typeof window !== "undefined") {
    const authData = {
      token: res.accessToken,
      role: res.user.role,
      userId: res.user.id,
      email: res.user.email,
    };
    window.localStorage.setItem("em_auth", JSON.stringify(authData));
  }

  return res;
}

export async function apiLogout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("em_auth");
  }
  return;
}

export async function apiRefreshToken(): Promise<LoginResponse> {
  const res = await apiFetch<LoginResponse>("/auth/refresh-token", {
    method: "POST",
  });

  if (typeof window !== "undefined") {
    const authData = {
      token: res.accessToken,
      role: res.user.role,
      userId: res.user.id,
      email: res.user.email,
    };
    window.localStorage.setItem("em_auth", JSON.stringify(authData));
  }

  return res;
}

// ---------------------------------------
// Core-Typen für Profile & Listen
// ---------------------------------------

export type Visibility = "PUBLIC" | "PRIVATE";

export interface GameDto {
  id: string;
  name: string;
  code?: string | null;
}

export interface GameRoleDto {
  id: string;
  name: string;
  gameId: string;
}

export interface PlayerGameProfileDto {
  id: string;
  gameId: string;
  gameName?: string;
  primaryRoleId?: string | null;
  primaryRoleName?: string | null;
  rank?: string | null;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  displayName: string | null;
  region: string | null;
  timezone: string | null;
  languages: string[] | null;
  bio: string | null;
  isPro: boolean;
  visibility: Visibility;
  createdAt?: string;
  gameProfiles: PlayerGameProfileDto[];
}

export interface TeamGameProfileDto {
  id: string;
  gameId: string;
  gameName?: string;
  primaryRoleId?: string | null;
  primaryRoleName?: string | null;
  minRank?: string | null;
  maxRank?: string | null;
}

export interface TeamProfile {
  id: string;
  userId: string;
  name: string;
  tag: string | null;
  region: string | null;
  level: string;
  isPro: boolean;
  visibility: Visibility;
  bio: string | null;
  createdAt?: string;
  gameProfiles: TeamGameProfileDto[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlayerProfileSummary {
  id: string;
  displayName: string | null;
  region: string | null;
  isPro: boolean;
  createdAt: string;
  gameProfiles?: PlayerGameProfileDto[];
}

export interface TeamProfileSummary {
  id: string;
  name: string;
  tag: string | null;
  region: string | null;
  level: string;
  isPro: boolean;
  createdAt: string;
  gameProfiles?: TeamGameProfileDto[];
}

// Für Listenansichten: Alias-Typen, damit Pages weiterhin PlayerListItem / TeamListItem importieren können
export type PlayerListItem = PlayerProfileSummary;
export type TeamListItem = TeamProfileSummary;

export type ContactRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type ContactRequestDirection = "INCOMING" | "OUTGOING";

export interface ContactRequestSummary {
  id: string;
  createdAt: string;
  status: ContactRequestStatus;
  message: string | null;
  direction: ContactRequestDirection;

  otherType: "PLAYER" | "TEAM";
  otherProfileId: string;
  otherName: string;

  target: {
    type: "PLAYER" | "TEAM";
    profileId: string;
    name: string;
  } | null;
}

// ---------------------------------------
// Player-Endpunkte
// ---------------------------------------

export interface UpdatePlayerProfileInput {
  displayName: string;
  region?: string;
  timezone?: string;
  languages?: string[];
  bio?: string;
  isPro: boolean;
  visibility: Visibility;
}

export async function apiGetMyPlayerProfile(): Promise<PlayerProfile> {
  return apiFetch<PlayerProfile>("/players/me", {
    method: "GET",
  });
}

export async function apiUpdateMyPlayerProfile(
  input: UpdatePlayerProfileInput,
): Promise<PlayerProfile> {
  return apiFetch<PlayerProfile>("/players/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export interface UpsertPlayerGameProfileInput {
  id?: string;
  gameId: string;
  primaryRoleId?: string;
  rank?: string;
}

/**
 * Game-Profile des eingeloggten Spielers upserten.
 * Frontend schickt ein Array von Game-Profile-Einträgen:
 * - mit id: Update
 * - ohne id: Create
 * Backend-Route: PUT /players/me/games
 */
export async function apiUpsertMyPlayerGameProfiles(
  payload: UpsertPlayerGameProfileInput[],
): Promise<PlayerProfile> {
  return apiFetch<PlayerProfile>("/players/me/games", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------
// Team-Game-Profile (offene Rollen / Spiele des Teams)
// ---------------------------------------

export interface UpsertTeamGameProfileInput {
  id?: string;
  gameId: string;
  primaryRoleId?: string;
  level?: string;
  rank?: string;
}

export async function apiUpsertTeamGameProfiles(
  teamId: string,
  payload: UpsertTeamGameProfileInput[],
): Promise<void> {
  await apiFetch(`/teams/${teamId}/games`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------
// Suche: Spieler & Teams
// ---------------------------------------

export interface SearchPlayersParams {
  gameId?: string;
  roleId?: string;
  region?: string;
  isPro?: boolean;
  page?: number;
  pageSize?: number;
  language?: string;
  rank?: string;
  q?: string;
}

export interface SearchTeamsParams {
  gameId?: string;
  roleId?: string;
  region?: string;
  level?: string;
  isPro?: boolean;
  page?: number;
  pageSize?: number;
  q?: string;
}

export async function apiSearchPlayers(
  params: SearchPlayersParams,
): Promise<PaginatedResult<PlayerProfileSummary>> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  if (params.gameId) query.set("gameId", params.gameId);
  if (params.roleId) query.set("roleId", params.roleId);

  if (params.region) query.set("region", params.region);
  if (params.language) query.set("language", params.language);
  if (params.rank) query.set("rank", params.rank);

  if (params.q) query.set("q", params.q);

  return apiFetch<PaginatedResult<PlayerProfileSummary>>(
    `/players/search?${query.toString()}`,
  );
}

export async function apiSearchTeams(
  params: SearchTeamsParams = {},
): Promise<PaginatedResult<TeamProfileSummary>> {
  const usp = new URLSearchParams();
  if (params.gameId) usp.set("gameId", params.gameId);
  if (params.roleId) usp.set("roleId", params.roleId);
  if (params.region) usp.set("region", params.region);
  if (params.level) usp.set("level", params.level);
  if (typeof params.isPro === "boolean") usp.set("isPro", String(params.isPro));
  if (params.page) usp.set("page", String(params.page));
  if (params.pageSize) usp.set("pageSize", String(params.pageSize));
  if (params.q) usp.set("q", params.q);

  const qs = usp.toString();
  const path = qs ? `/teams?${qs}` : "/teams";

  return apiFetch<PaginatedResult<TeamProfileSummary>>(path, {
    method: "GET",
  });
}

// ---------------------------------------
// Games & Rollen
// ---------------------------------------

export async function apiGetGames(): Promise<GameDto[]> {
  return apiFetch<GameDto[]>("/games", {
    method: "GET",
  });
}

export async function apiGetGameRoles(gameId: string): Promise<GameRoleDto[]> {
  return apiFetch<GameRoleDto[]>(`/games/${gameId}/roles`, {
    method: "GET",
  });
}

export async function apiGetGameRanks(
  gameId: string,
  roleId?: string,
): Promise<GameRankDto[]> {
  const params = new URLSearchParams();
  if (roleId) params.set("roleId", roleId);

  const query = params.toString();
  const url = query
    ? `/games/${gameId}/ranks?${query}`
    : `/games/${gameId}/ranks`;

  return apiFetch<GameRankDto[]>(url);
}

// ---------------------------------------
// Kontakt-Anfragen
// ---------------------------------------

export async function apiCreateContactRequestForPlayer(
  targetPlayerId: string,
  message?: string,
): Promise<ContactRequestSummary> {
  return apiFetch<ContactRequestSummary>("/contact-requests", {
    method: "POST",
    body: JSON.stringify({ targetPlayerId, message }),
  });
}

export async function apiCreateContactRequestForTeam(
  targetTeamId: string,
  message?: string,
): Promise<ContactRequestSummary> {
  return apiFetch<ContactRequestSummary>("/contact-requests", {
    method: "POST",
    body: JSON.stringify({ targetTeamId, message }),
  });
}

export async function apiGetIncomingContactRequests(): Promise<
  ContactRequestSummary[]
> {
  return apiFetch<ContactRequestSummary[]>("/contact-requests/incoming");
}

export async function apiGetOutgoingContactRequests(): Promise<
  ContactRequestSummary[]
> {
  return apiFetch<ContactRequestSummary[]>("/contact-requests/outgoing");
}

export async function apiUpdateContactRequestStatus(
  id: string,
  status: ContactRequestStatus,
): Promise<void> {
  await apiFetch<void>(`/contact-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Team-Profil (aktueller User) ---

// Falls du magst, kannst du hier später ein genaueres Typ-Interface ergänzen
export async function apiGetMyTeamProfile(): Promise<any> {
  return apiFetch<any>("/teams/me");
}

export async function apiUpdateMyTeamProfile(data: any): Promise<any> {
  return apiFetch<any>("/teams/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------
// Matching – Vorschläge für eingeloggten User
// ---------------------------------------

// Teams, die zu mir (eingeloggter User) passen
export async function apiGetMatchingTeamsForMe(): Promise<TeamProfileSummary[]> {
  return apiFetch<TeamProfileSummary[]>("/matching/teams-for-me");
}

// Spieler, die zu mir (eingeloggter User / Team) passen
export async function apiGetMatchingPlayersForMe(): Promise<PlayerProfileSummary[]> {
  return apiFetch<PlayerProfileSummary[]>("/matching/players-for-me");
}
