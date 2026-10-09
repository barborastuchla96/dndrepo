# Race Finder CZ

Searchable directory of running races in the Czech Republic — distance, surface, location, dates, and extra info, from major city marathons down to small local 5Ks.

## Run it

```bash
cd race-finder
npm install
npm run dev
```

Visit http://localhost:3000. Search and filter by name/town, region, surface, distance range, and date range.

## Data

Race data lives in `data/races.json` (`lib/types.ts` defines the `Race` shape). It currently ships with ~20 hand-curated real Czech races spanning marathons, half marathons, trail/ultra runs, OCR, and weekly free parkruns, across all major regions.

## Adding data via scraping

`scripts/scrape.ts` is the entry point for pulling fresh race listings from public Czech race-calendar sites (e.g. behej.com, runczech.com, mattonicup.cz). It merges scraped entries into `data/races.json` by id.

```bash
npm run scrape
```

Each source needs its own scraper function registered in `SCRAPERS` — inspect the live page HTML and adjust the `cheerio` selectors, since site markup changes over time. The included `scrapeBehej` is a starting template, not production-ready.

Note: outbound network access depends on your environment; sandboxed/CI environments with restricted egress will need to run the scraper elsewhere (locally, or a CI job with open network access) and commit the resulting `data/races.json`.

## Next steps

- Swap the JSON file for a real database (SQLite/Postgres) once data volume grows beyond easy hand-editing.
- Add a community submission form for small/local races that aren't covered by any scraped source.
- Add map view and "races near me" geolocation search.
