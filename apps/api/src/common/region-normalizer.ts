// apps/api/src/common/region-normalizer.ts

const REGION_NORMALIZATION_MAP: Record<string, string> = {
  // EUW
  EUW: "EUW",
  "EU WEST": "EUW",
  EU_WEST: "EUW",
  "EU-WEST": "EUW",

  // EUNE
  EUNE: "EUNE",
  "EU NORDIC & EAST": "EUNE",
  EU_NORDIC_EAST: "EUNE",
  "EU NORDIC AND EAST": "EUNE",

  // DACH
  DACH: "DACH",
  "DE/AT/CH": "DACH",
  "DE-AT-CH": "DACH",

  // EU
  EU: "EU",
  EUROPE: "EU",

  // NA
  NA: "NA",
  "NORTH AMERICA": "NA",
  NA_SERVER: "NA",
};

export function normalizeRegion(input?: string | null): string | null {
  if (!input) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  const key = raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");

  if (REGION_NORMALIZATION_MAP[key]) {
    return REGION_NORMALIZATION_MAP[key];
  }

  if (REGION_NORMALIZATION_MAP[raw.toUpperCase()]) {
    return REGION_NORMALIZATION_MAP[raw.toUpperCase()];
  }

  return raw.toUpperCase();
}
