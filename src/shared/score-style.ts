/** Vivino score → badge accent color (matches Testing project scale). */

export interface ScoreStyle {
  id: "excellent" | "fair" | "low" | "unknown";
  accent: string;
}

const STAR_COLOR = "#fbbf24";
const UNKNOWN_ACCENT = "#6b7280";

/** Map Vivino 0–5 rating to readable badge accent (green / amber / red / grey). */
export function getScoreStyle(rating: number | null): ScoreStyle {
  if (rating === null || rating <= 0) {
    return { id: "unknown", accent: UNKNOWN_ACCENT };
  }
  if (rating > 4.0) {
    return { id: "excellent", accent: "#22c55e" };
  }
  if (rating >= 3.5) {
    return { id: "fair", accent: "#eab308" };
  }
  return { id: "low", accent: "#ef4444" };
}

/** 13% opacity tint for badge background. */
export function scoreBadgeBackground(accent: string): string {
  return `${accent}22`;
}

/** 27% opacity tint for badge border. */
export function scoreBadgeBorder(accent: string): string {
  return `${accent}44`;
}

export function scoreStarColor(): string {
  return STAR_COLOR;
}
