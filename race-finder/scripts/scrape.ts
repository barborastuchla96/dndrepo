/**
 * Race scraper — run with: npm run scrape
 *
 * Sources:
 *   1. behej.com/terminovka  — largest Czech race calendar (HTML)
 *   2. runczech.com          — Prague major races (HTML)
 *   3. itra.run API          — Czech ITRA trail races (JSON API)
 *
 * Each scraper merges into data/races.json by id, preserving manual
 * entries that have no matching scraped id.
 */

import * as cheerio from "cheerio";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { Race, Surface } from "../lib/types";

const DATA_PATH = path.join(__dirname, "..", "data", "races.json");

// ─── helpers ────────────────────────────────────────────────────────────────

function slug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDistances(raw: string): number[] {
  const nums: number[] = [];
  for (const m of raw.matchAll(/(\d+(?:[.,]\d+)?)\s*km/gi)) {
    nums.push(parseFloat(m[1].replace(",", ".")));
  }
  // also catch bare numbers like "42", "21", "10", "5"
  if (nums.length === 0) {
    for (const m of raw.matchAll(/\b(\d{1,3}(?:[.,]\d+)?)\b/g)) {
      const n = parseFloat(m[1].replace(",", "."));
      if (n >= 1 && n <= 250) nums.push(n);
    }
  }
  return [...new Set(nums)].sort((a, b) => b - a);
}

function guessSurface(name: string, type: string): Surface {
  const t = (name + " " + type).toLowerCase();
  if (/trail|hora|hory|vrch|ultra|les|příroda|mountain|skyrace/.test(t)) return "trail";
  if (/ocr|překážk|spartan|mud|obstacle|bahno/.test(t)) return "mixed";
  if (/dráha|oval|track/.test(t)) return "track";
  return "road";
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "RaceFinderCZ/1.0 (+https://github.com/barborastuchla96/dndrepo)",
      "Accept-Language": "cs,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── behej.com ──────────────────────────────────────────────────────────────
// behej.com/terminovka lists races in a table. Each row has:
//   td.date, td.name > a, td.location, td.distance, td.type
// The page is server-rendered and paginates via ?page=N.

async function scrapeBehej(): Promise<Race[]> {
  const races: Race[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const url = `https://www.behej.com/terminovka?page=${page}`;
    console.log(`  [behej] page ${page}: ${url}`);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const rows = $("table.race-list tr, table.zavody tr, .terminovka-table tr, .race-table tr").filter((_, el) => {
      return $(el).find("td").length >= 3;
    });

    if (rows.length === 0) {
      // try generic table rows as fallback
      const anyRows = $("table tr").filter((_, el) => $(el).find("td").length >= 3);
      if (anyRows.length === 0) { hasMore = false; break; }
    }

    let found = 0;
    rows.each((_, el) => {
      const tds = $(el).find("td");
      const dateRaw = tds.eq(0).text().trim();
      const name = tds.eq(1).find("a").first().text().trim() || tds.eq(1).text().trim();
      const href = tds.eq(1).find("a").attr("href") ?? "";
      const location = tds.eq(2).text().trim();
      const distRaw = tds.eq(3).text().trim();
      const typeRaw = tds.eq(4).text().trim();

      if (!name || !dateRaw) return;

      // parse Czech date: "8.10.2026" or "08. 10. 2026"
      const dm = dateRaw.match(/(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})/);
      if (!dm) return;
      const date = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;

      const distancesKm = parseDistances(distRaw);
      const surface = guessSurface(name, typeRaw);
      const website = href.startsWith("http") ? href : href ? `https://www.behej.com${href}` : undefined;

      races.push({
        id: `behej-${slug(name)}-${date.slice(0, 4)}`,
        name, date, region: "", location, distancesKm, surface,
        description: [typeRaw, distRaw].filter(Boolean).join(" · "),
        website, source: "behej.com",
      });
      found++;
    });

    console.log(`  [behej] page ${page}: found ${found} races`);
    // stop if page had no races or no "next" link
    hasMore = found > 0 && $("a[rel=next], .pagination .next, a:contains('Další')").length > 0;
    page++;
  }

  return races;
}

// ─── runczech.com ────────────────────────────────────────────────────────────
// RunCzech organises the major Prague races. Their /cs/zavody page lists them.

async function scrapeRunCzech(): Promise<Race[]> {
  const html = await fetchHtml("https://www.runczech.com/cs/zavody/");
  const $ = cheerio.load(html);
  const races: Race[] = [];

  $(".event-item, .race-item, article.event, .zavod-item").each((_, el) => {
    const name = $(el).find("h2, h3, .event-title, .name").first().text().trim();
    const dateRaw = $(el).find(".date, time, .event-date").first().text().trim();
    const href = $(el).find("a").first().attr("href") ?? "";
    const distRaw = $(el).find(".distance, .distances").first().text().trim();

    if (!name || !dateRaw) return;
    const dm = dateRaw.match(/(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})/);
    if (!dm) return;
    const date = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;

    races.push({
      id: `runczech-${slug(name)}-${date.slice(0, 4)}`,
      name, date, region: "Praha", location: "Praha",
      distancesKm: parseDistances(distRaw),
      surface: "road",
      description: `RunCzech event.`,
      website: href.startsWith("http") ? href : `https://www.runczech.com${href}`,
      source: "runczech.com",
    });
  });

  console.log(`  [runczech] found ${races.length} races`);
  return races;
}

// ─── itra.run ────────────────────────────────────────────────────────────────
// ITRA exposes a public JSON API used by their race finder.

async function scrapeItra(): Promise<Race[]> {
  const year = new Date().getFullYear();
  const urls = [
    `https://itra.run/api/Races/GetRaces?country=CZE&year=${year}&page=1&pageSize=200`,
    `https://itra.run/api/races/search?country=CZE&limit=200`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "RaceFinderCZ/1.0" },
      });
      if (!res.ok) continue;
      const json = await res.json() as {
        races?: Array<{
          name: string; date: string; city: string;
          distanceKm?: number; distances?: number[];
          itraPoints?: number; website?: string; country?: string;
        }>;
        data?: Array<{ name: string; date: string; city: string; distanceKm?: number; itraPoints?: number; website?: string }>;
      };

      const items = json.races ?? json.data ?? [];
      if (items.length === 0) continue;

      const races: Race[] = items.map((r) => ({
        id: `itra-${slug(r.name)}-${String(r.date).slice(0, 4)}`,
        name: r.name,
        date: String(r.date).slice(0, 10),
        region: "",
        location: r.city ?? "",
        distancesKm: (r as { distances?: number[] }).distances ?? (r.distanceKm ? [r.distanceKm] : []),
        surface: "trail" as Surface,
        itraPoints: r.itraPoints,
        description: `ITRA-listed trail race.${r.itraPoints ? ` ITRA points: ${r.itraPoints}.` : ""}`,
        website: r.website,
        source: "itra.run",
      }));

      console.log(`  [itra] found ${races.length} races from ${url}`);
      return races;
    } catch (err) {
      console.warn(`  [itra] ${url} failed: ${err}`);
    }
  }

  console.warn("  [itra] all endpoints failed");
  return [];
}

// ─── main ────────────────────────────────────────────────────────────────────

const SCRAPERS: Record<string, () => Promise<Race[]>> = {
  itra: scrapeItra,
  runczech: scrapeRunCzech,
  behej: scrapeBehej,
};

async function main() {
  const existing: Race[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  // keep manually-curated entries (those not from a scraper source)
  const manual = existing.filter((r) =>
    !["behej.com", "runczech.com", "itra.run"].includes(r.source)
  );
  const byId = new Map(manual.map((r) => [r.id, r]));

  for (const [name, scraper] of Object.entries(SCRAPERS)) {
    console.log(`\n[${name}] scraping...`);
    try {
      const scraped = await scraper();
      for (const race of scraped) {
        // skip if no date or name
        if (!race.name || !race.date) continue;
        byId.set(race.id, race);
      }
      console.log(`[${name}] done — ${scraped.length} races`);
    } catch (err) {
      console.error(`[${name}] failed:`, err);
    }
  }

  const merged = Array.from(byId.values())
    .filter((r) => r.name && r.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`\nWrote ${merged.length} races to data/races.json`);
}

main();
