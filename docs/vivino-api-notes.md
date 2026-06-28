# Vivino API notes (ALA-69 spike)

Reverse-engineered **2026-06-28** for Drink Good extension. Vivino has no public API; these are internal endpoints used by [vivino.com](https://www.vivino.com).

## Strategy (hybrid)

| Step | Endpoint | Purpose |
|------|----------|---------|
| 1 | **Algolia** `WINES_prod` | Full-catalog text search; vintages array includes per-year stats |
| 2 | **Explore** `/api/explore/explore` | Fallback when Algolia returns no vintage match; HK marketplace |
| 3 | Matcher (B+C) | Vintage gate + name similarity threshold |

Implementation: `src/vivino/`

## Required headers

```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ...
Accept: application/json
Accept-Language: en-US,en;q=0.9
```

Without a browser `User-Agent`, Vivino returns errors.

---

## 1. Algolia search (primary)

**URL:** `POST https://{APP_ID}-dsn.algolia.net/1/indexes/WINES_prod/query`

**Credentials** (search-only, embedded in Vivino client JS as of 2026-06):

| Key | Value |
|-----|-------|
| `x-algolia-application-id` | `9TAKGWJUXL` |
| `x-algolia-api-key` | `60c11b2f1068885161d95ca068d3a6ae` |
| Index | `WINES_prod` |

**Body:**

```json
{
  "params": "query=Chateau+Lynch+Bages&hitsPerPage=15"
}
```

**Response shape:** `{ hits: AlgoliaHit[], nbHits: number }`

Each hit includes:

- `id` — wine id
- `name`, `winery.name`, `winery.seo_name`
- `vintages[]` — `{ id, year, name, statistics: { ratings_average, ratings_count } }`

Pick the vintage where `year` matches the shop title (e.g. `"2019"` string or number).

**Vivino URL:** `https://www.vivino.com/{winery.seo_name}/w/{wine_id}?year={year}`

---

## 2. Explore API (fallback)

**URL:** `GET https://www.vivino.com/api/explore/explore`

**Params:**

| Param | Example | Notes |
|-------|---------|-------|
| `search_term` | `Chateau Lynch Bages` | Free-text search |
| `wine_years[]` | `2019` | **Required for vintage filter** — array syntax |
| `country_code` | `hk` | User region |
| `currency_code` | `HKD` | Pricing currency |
| `page` | `1` | 1-indexed |

**Example:**

```
GET /api/explore/explore?search_term=Chateau+Lynch+Bages&wine_years[]=2019&country_code=hk&currency_code=HKD&page=1
```

**Response path:** `explore_vintage.matches[].vintage`

Each match has vintage-level `statistics.ratings_average` (0–5 scale).

---

## 3. Vintage detail (optional enrichment)

**URL:** `GET https://www.vivino.com/api/vintages/{vintage_id}`

Returns full vintage + wine metadata. Use when Algolia vintage lacks statistics.

---

## Match thresholds (proposed)

Tuned against Wineview sample titles:

| Case | Threshold | Constant |
|------|-----------|----------|
| Vintage present in shop title | **0.55** | `DEFAULT_VINTAGE_MATCH_THRESHOLD` |
| No vintage in title | **0.72** | `DEFAULT_NAME_ONLY_THRESHOLD` |

Below threshold → grey `?` badge (no Vivino link).

---

## Rate limiting

- Client default: **500ms** between requests (~2/sec)
- Retry: exponential backoff on 429/5xx (3 attempts)

---

## Sample: Lynch Bages 2019

**Algolia vintage:**

```json
{
  "id": 159410667,
  "year": "2019",
  "name": "Château Lynch-Bages Pauillac (Grand Cru Classé) 2019",
  "statistics": { "ratings_average": 4.3, "ratings_count": 713 }
}
```

**Explore** returns same `vintage.id` when `wine_years[]=2019` is set.

---

## Risks

- Algolia keys and explore params may rotate without notice — isolate in `src/vivino/`
- Vivino ToS prohibits automated access; keep volume low (personal use)
- AWS WAF may block datacenter IPs; extension runs in user's browser (residential IP)

---

## Verification

```bash
npm install
npm test                    # offline unit tests with fixtures
npm run test:vivino:live    # live smoke against Vivino
```

Fixtures: `tests/fixtures/vivino-*.json`
