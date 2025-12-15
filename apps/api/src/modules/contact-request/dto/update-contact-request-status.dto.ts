import { IsIn, IsOptional } from "class-validator";

// Wir erlauben bewusst beide Varianten (REJECTED/DECLINED),
// weil es je nach Prisma-Enum-Version unterschiedlich sein kann.
export type ContactRequestStatusInput =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "DECLINED";

export class UpdateContactRequestStatusDto {
  @IsOptional()
  @IsIn(["PENDING", "ACCEPTED", "REJECTED", "DECLINED"])
  status?: ContactRequestStatusInput;

  // Falls irgendein Frontend/alte Version "newStatus" sendet:
  @IsOptional()
  @IsIn(["PENDING", "ACCEPTED", "REJECTED", "DECLINED"])
  newStatus?: ContactRequestStatusInput;
}
