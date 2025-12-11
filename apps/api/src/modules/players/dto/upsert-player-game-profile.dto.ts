export class UpsertPlayerGameProfileDto {
  /**
   * Game.id (String)
   */
  gameId!: string;

  /**
   * GameRole.id – optional
   */
  primaryRoleId?: string | null;

  /**
   * Rank/Elo in beliebigem String-Format
   */
  rank?: string | null;

  /**
   * Numerischer Wert, falls du MMR speichern willst
   */
  mmr?: number | null;

  /**
   * Ob der Spieler aktiv nach einem Team sucht
   */
  lookingForTeam?: boolean;
}
