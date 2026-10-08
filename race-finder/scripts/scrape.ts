/**
 * Scraper entry point for populating data/races.json from public Czech
 * race-calendar sites. Run locally or in CI with open network access:
 *
 *   npm run scrape
 *
 * Add one function per source following the `Scraper` shape, then register
 * it in `SCRAPERS`. Results are merged into data/races.json by id.
 */
import * as cheerio from "cheerio";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { Race } from "../lib/types";

type Scraper = () => Promise<Race[]>;

const DATA_PATH = path.join(__dirname, "..", "data", "races.json");

// ── behej.com ──────────────────────────────────────────────────────────────
// Adjust selectors after inspecting the live HTML — they change over time.
const scrapeBehej: Scraper = async () => {
  const res = await fetch("https://www.behej.com/zavody");
  const html = await res.text();
  const $ = cheerio.load(html);
  const races: Race[] = [];

  $(".race-item").each((_, el) => {
    const name = $(el).find(".race-name").text().trim();
    const date = $(el).find(".race-date").attr("data-date") ?? "";
    const location = $(el).find(".race-location").text().trim();
    if (!name || !date) return;
    races.push({
      id: `behej-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name, date, region: "", location, distancesKm: [],
      surface: "road", description: "", source: "behej.com",
    });
  });
  return races;
};

// ── itra.run ───────────────────────────────────────────────────────────────
// ITRA provides a JSON search endpoint; country code for Czech Republic = CZE.
// Returns races with their ITRA point value.
const scrapeItra: Scraper = async () => {
  const url = "https://itra.run/api/races/search?country=CZE&limit=200";
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "race-finder-cz/1.0" },
  });
  if (!res.ok) throw new Error(`ITRA returned ${res.status}`);
  const json: { races?: { name: string; date: string; city: string; distanceKm: number; itraPoints: number; website?: string }[] } = await res.json();

  return (json.races ?? []).map((r) => ({
    id: `itra-${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${r.date.slice(0, 4)}`,
    name: r.name,
    date: r.date.slice(0, 10),
    region: "",
    location: r.city,
    distancesKm: [r.distanceKm],
    surface: "trail" as const,
    itraPoints: r.itraPoints,
    description: `ITRA-listed trail race. ITRA points: ${r.itraPoints}.`,
    website: r.website,
    source: "itra.run",
  }));
};

const SCRAPERS: Record<string, Scraper> = {
  itra: scrapeItra,
  behej: scrapeBehej,
};

async function main() {
  const existing: Race[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const byId = new Map(existing.map((r) => [r.id, r]));

  for (const [name, scraper] of Object.entries(SCRAPERS)) {
    try {
      const scraped = await scraper();
      for (const race of scraped) byId.set(race.id, race);
      console.log(`[${name}] scraped ${scraped.length} races`);
    } catch (err) {
      console.error(`[${name}] failed:`, err);
    }
  }

  const merged = Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} races to ${DATA_PATH}`);
}

main();
