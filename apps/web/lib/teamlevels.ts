// apps/web/lib/team-levels.ts

export type TeamLevelCode = "FUN" | "SEMI_COMP" | "COMP" | "PRO";

export const TEAM_LEVEL_OPTIONS: { value: TeamLevelCode; label: string }[] = [
  { value: "FUN",        label: "Fun / Hobby" },
  { value: "SEMI_COMP",  label: "Semi-Competitive" },
  { value: "COMP",       label: "Competitive" },
  { value: "PRO",        label: "Professional" },
];

export function getTeamLevelLabel(value?: string | null): string {
  if (!value) return "–";
  const found = TEAM_LEVEL_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value; // Fallback: zeigt den Rohwert
}
