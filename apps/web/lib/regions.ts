// apps/web/lib/regions.ts

export type RegionCode =
  | "EUW"
  | "EUNE"
  | "DACH"
  | "EU"
  | "NA"
  | "LAN"
  | "LAS"
  | "OCE"
  | "BR"
  | "TR"
  | "RU"
  | "KR"
  | "JP";

export const REGION_OPTIONS: { value: RegionCode; label: string }[] = [
  { value: "EUW", label: "EUW – Europe West" },
  { value: "EUNE", label: "EUNE – Europe Nordic & East" },
  { value: "DACH", label: "DACH – Deutschland / Österreich / Schweiz" },
  { value: "EU", label: "EU – Europe (Other)" },
  { value: "NA", label: "NA – North America" },
  { value: "LAN", label: "LAN – Latin America North" },
  { value: "LAS", label: "LAS – Latin America South" },
  { value: "OCE", label: "OCE – Oceania" },
  { value: "BR", label: "BR – Brazil" },
  { value: "TR", label: "TR – Turkey" },
  { value: "RU", label: "RU – Russia" },
  { value: "KR", label: "KR – Korea" },
  { value: "JP", label: "JP – Japan" },
];
