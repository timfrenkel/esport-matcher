// apps/api/src/modules/contact-request/dto/update-contact-request-status.dto.ts

// Unabhängig von Prisma definieren wir den Status-Typ hier:
export type ContactRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export class UpdateContactRequestStatusDto {
  // "!" = definite assignment assertion (wird zur Laufzeit nicht ausgewertet)
  status!: ContactRequestStatus;
}
