/**
 * Scraper entry point for populating data/races.json from public Czech
 * race-calendar sites. This cannot run inside the current sandbox (no
 * outbound network access beyond the repo host) — run it locally or in CI
 * where network access is available.
 *
 * Usage: npm run scrape
 *
 * Add one function per source below, following the `Scraper` shape, then
 * register it in `SCRAPERS`. Run `npm run scrape` to merge fresh results
 * into data/races.json (existing entries with the same id are overwritten).
 */
import * as cheerio from "cheerio";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { Race } from "../lib/types";

type Scraper = () => Promise<Race[]>;

const DATA_PATH = path.join(__dirname, "..", "data", "races.json");

// Example scraper for behej.com's public race calendar. Selectors are
// illustrative — inspect the live page HTML and adjust before relying on
// this in production.
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
      name,
      date,
      region: "",
      location,
      distancesKm: [],
      surface: "road",
      description: "",
      source: "behej.com",
    });
  });

  return races;
};

const SCRAPERS: Record<string, Scraper> = {
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
