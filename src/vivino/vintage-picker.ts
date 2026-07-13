/** Pick the best Algolia vintage entry for a shop query. */

export interface AlgoliaVintageLike {
  id: number;
  year?: number | string;
  statistics?: {
    ratings_count?: number;
  };
}

/** Parse a four-digit vintage year; U.V. and empty map to null. */
export function parseVintageYear(
  value: number | string | undefined,
): number | null {
  if (value === undefined || value === null || value === "U.V.") {
    return null;
  }
  const year = Number.parseInt(String(value), 10);
  return Number.isFinite(year) ? year : null;
}

function isNonVintageYear(value: number | string | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (value === "U.V.") {
    return true;
  }
  return String(value).trim() === "";
}

function pickNonVintageVintage<T extends AlgoliaVintageLike>(
  pool: T[],
): T | null {
  const uv = pool.find((vintage) => vintage.year === "U.V.");
  if (uv) {
    return uv;
  }

  const blank = pool.find((vintage) => isNonVintageYear(vintage.year));
  if (blank) {
    return blank;
  }

  return pool[0] ?? null;
}

function pickLatestNumericVintage<T extends AlgoliaVintageLike>(
  pool: T[],
): T | null {
  const numeric = pool.filter(
    (vintage) => parseVintageYear(vintage.year) !== null,
  );
  if (numeric.length === 0) {
    return null;
  }

  return numeric.reduce<T>((best, current) => {
    const bestYear = parseVintageYear(best.year) ?? -1;
    const currentYear = parseVintageYear(current.year) ?? -1;
    return currentYear > bestYear ? current : best;
  }, numeric[0]);
}

/**
 * Select an Algolia vintage row for a shop query.
 * When {@link preferNonVintage} is set, U.V. rows win over numbered years.
 */
export function pickVintage<T extends AlgoliaVintageLike>(
  vintages: T[],
  targetVintage: number | null,
  preferNonVintage: boolean = false,
): T | null {
  if (vintages.length === 0) {
    return null;
  }

  if (targetVintage !== null) {
    const exact = vintages.find(
      (vintage) => parseVintageYear(vintage.year) === targetVintage,
    );
    if (exact) {
      return exact;
    }
    if (preferNonVintage) {
      return pickNonVintageVintage(vintages);
    }
    return null;
  }

  const rated = vintages.filter(
    (vintage) => (vintage.statistics?.ratings_count ?? 0) > 0,
  );
  const pool = rated.length > 0 ? rated : vintages;

  if (preferNonVintage) {
    const nonVintage = pickNonVintageVintage(pool);
    if (nonVintage) {
      return nonVintage;
    }
  }

  const latestNumeric = pickLatestNumericVintage(pool);
  if (latestNumeric) {
    return latestNumeric;
  }

  return pickNonVintageVintage(pool);
}
