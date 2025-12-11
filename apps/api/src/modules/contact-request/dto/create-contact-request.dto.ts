export class CreateContactRequestDto {
  // genau EIN Ziel muss gesetzt sein
  targetPlayerId?: string;
  targetTeamId?: string;
  message?: string;
}
