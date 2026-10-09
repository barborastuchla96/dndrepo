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
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { chromium } from "playwright";
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

// behej.com renders races client-side via JS, so we use Playwright
async function scrapeBehej(): Promise<Race[]> {
  const races: Race[] = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    let pageNum = 1;
    let hasMore = true;

    while (hasMore && pageNum <= 20) {
      const url = `https://www.behej.com/terminovka?page=${pageNum}`;
      console.log(`  [behej] page ${pageNum}: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Wait up to 8s for actual race rows to appear
      await page.waitForSelector("table tr td", { timeout: 8000 }).catch(() => {});
      // Extra small delay for JS to finish populating
      await page.waitForTimeout(2000);

      const html = await page.content();

      // Debug: dump rendered HTML on first page
      if (pageNum === 1) {
        const debugPath = path.join(__dirname, "..", "data", "behej-debug.html");
        writeFileSync(debugPath, html);
        const $ = cheerio.load(html);
        console.log(`  [behej-debug] tables: ${$("table").length}, tr: ${$("tr").length}, td: ${$("td").length}`);
        console.log(`  [behej-debug] table HTML: ${$("table").html()?.slice(0, 600).replace(/\s+/g, " ")}`);
        console.log(`  [behej-debug] saved full HTML to data/behej-debug.html`);
      }

      const $ = cheerio.load(html);

      // The table columns (from header): [icon] [Datum] [flag] [Název akce, Místo] [Délka] [Pohár/seriál] [Ode mne]
      // col 0=icon, 1=date, 2=flag, 3=name+location, 4=distance, 5=series, 6=distance-from-me
      const rows = $("table tr").filter((_, el) => $(el).find("td").length >= 4);

      let found = 0;
      rows.each((_, el) => {
        const tds = $(el).find("td");
        const dateRaw = tds.eq(1).text().trim();
        const nameCell = tds.eq(3);
        const name = nameCell.find("a").first().text().trim() || nameCell.text().trim().split("\n")[0].trim();
        const href = nameCell.find("a").first().attr("href") ?? "";
        // location is often a second line in the name cell
        const location = nameCell.text().trim().split("\n").slice(1).join(" ").trim();
        const distRaw = tds.eq(4).text().trim();

        if (!name || !dateRaw) return;
        const dm = dateRaw.match(/(\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{4})/);
        if (!dm) return;
        const date = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;

        races.push({
          id: `behej-${slug(name)}-${date.slice(0, 4)}`,
          name, date, region: "", location: location || "",
          distancesKm: parseDistances(distRaw),
          surface: guessSurface(name, distRaw),
          description: distRaw || "",
          website: href.startsWith("http") ? href : href ? `https://www.behej.com${href}` : undefined,
          source: "behej.com",
        });
        found++;
      });

      console.log(`  [behej] page ${pageNum}: found ${found} races`);
      hasMore = found > 0 && await page.$("a:has-text('Další'), a[rel=next], .next-page") !== null;
      pageNum++;
    }
  } finally {
    await browser.close();
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

// ITRA renders its race finder client-side — use Playwright and intercept the API call
async function scrapeItra(): Promise<Race[]> {
  const browser = await chromium.launch({ headless: true });
  const races: Race[] = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Intercept the JSON API response that ITRA's race finder calls
    let apiData: unknown = null;
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("itra.run/api") || url.includes("itra.run/Races")) {
        try {
          const ct = response.headers()["content-type"] ?? "";
          if (ct.includes("json")) {
            const text = await response.text();
            if (text.length > 10) {
              console.log(`  [itra] intercepted API: ${url.slice(0, 80)} (${text.length} bytes)`);
              try { apiData = JSON.parse(text); } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }
      }
    });

    // Navigate to ITRA race finder filtered to Czech Republic
    const year = new Date().getFullYear();
    await page.goto(`https://itra.run/Races/FindRace?countryCode=CZE&year=${year}`, {
      waitUntil: "domcontentloaded", timeout: 25000,
    });
    await page.waitForTimeout(5000); // wait for JS/API calls to fire

    // Try next year too if current year has few results
    if (!apiData) {
      await page.goto(`https://itra.run/Races/FindRace?country=CZE&year=${year}`, {
        waitUntil: "domcontentloaded", timeout: 20000,
      });
      await page.waitForTimeout(4000);
    }

    if (apiData) {
      const obj = apiData as Record<string, unknown>;
      const items = (obj["races"] ?? obj["data"] ?? obj["results"] ?? (Array.isArray(apiData) ? apiData : [])) as Array<{
        name?: string; raceName?: string; date?: string; startDate?: string;
        city?: string; location?: string; distanceKm?: number;
        distances?: number[]; itraPoints?: number; mountPoints?: number;
        website?: string; url?: string;
      }>;

      for (const r of items) {
        const name = r.name ?? r.raceName ?? "";
        const date = String(r.date ?? r.startDate ?? "").slice(0, 10);
        if (!name || !date) continue;
        races.push({
          id: `itra-${slug(name)}-${date.slice(0, 4)}`,
          name, date, region: "", location: r.city ?? r.location ?? "",
          distancesKm: r.distances ?? (r.distanceKm ? [r.distanceKm] : []),
          surface: "trail",
          itraPoints: r.itraPoints ?? r.mountPoints,
          description: `ITRA-listed trail race.${r.itraPoints ? ` ITRA points: ${r.itraPoints}.` : ""}`,
          website: r.website ?? r.url,
          source: "itra.run",
        });
      }
      console.log(`  [itra] parsed ${races.length} races from intercepted API`);
    }

    // Fallback: parse the rendered HTML
    if (races.length === 0) {
      const html = await page.content();
      const $ = cheerio.load(html);
      console.log(`  [itra] HTML fallback — page title: ${$("title").text().trim()}`);
      // Look for race rows with a date pattern
      $("tr, .race-item, .event-item, [class*='race'], [class*='event']").each((_, el) => {
        const text = $(el).text();
        const dm = text.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
        if (!dm) return;
        const date = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
        const name = $(el).find("a").first().text().trim() || text.split("\n")[0].trim();
        const href = $(el).find("a").first().attr("href") ?? "";
        if (!name || name.length < 3) return;
        races.push({
          id: `itra-${slug(name)}-${date.slice(0, 4)}`,
          name, date, region: "", location: "",
          distancesKm: parseDistances(text), surface: "trail",
          description: "ITRA-listed trail race.",
          website: href.startsWith("http") ? href : href ? `https://itra.run${href}` : undefined,
          source: "itra.run",
        });
      });
      console.log(`  [itra] HTML fallback found ${races.length} races`);
    }
  } finally {
    await browser.close();
  }
  return races;
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
