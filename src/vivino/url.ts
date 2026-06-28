/** Build Vivino wine page URLs from API payloads. */

const DEFAULT_BASE_URL = "https://www.vivino.com";

export function buildVivinoUrl(
  wineId: number,
  winerySeoName: string | null | undefined,
  vintageYear: number | string | null | undefined,
  baseUrl: string = DEFAULT_BASE_URL,
): string {
  const path = winerySeoName
    ? `${winerySeoName}/w/${wineId}`
    : `w/${wineId}`;
  const url = new URL(path, `${baseUrl}/`);
  if (
    vintageYear !== null &&
    vintageYear !== undefined &&
    String(vintageYear) !== "U.V."
  ) {
    url.searchParams.set("year", String(vintageYear));
  }
  return url.toString();
}
