"use client";

import { useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type QuickFilter = "all" | "road" | "trail" | "mixed" | "short" | "half" | "marathon" | "ultra";

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "road",     label: "Road" },
  { id: "trail",    label: "Trail" },
  { id: "mixed",    label: "Mixed / OCR" },
  { id: "short",    label: "Up to 10 km" },
  { id: "half",     label: "Half marathon" },
  { id: "marathon", label: "Marathon" },
  { id: "ultra",    label: "Ultra (50 km+)" },
];

function matchesQuick(race: Race, qf: QuickFilter): boolean {
  if (qf === "all") return true;
  if (qf === "road") return race.surface === "road";
  if (qf === "trail") return race.surface === "trail";
  if (qf === "mixed") return race.surface === "mixed";
  if (qf === "short") return race.distancesKm.some((d) => d <= 10);
  if (qf === "half") return race.distancesKm.some((d) => d >= 20 && d <= 22);
  if (qf === "marathon") return race.distancesKm.some((d) => d >= 40 && d <= 45);
  if (qf === "ultra") return race.distancesKm.some((d) => d >= 50);
  return true;
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.getDate(),
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
  };
}

function fmtDistances(dists: number[]) {
  return dists.map((d) => (Number.isInteger(d) ? d : d.toFixed(1))).join(" / ") + " km";
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [surface, setSurface] = useState("");
  const [minDistance, setMinDistance] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quick, setQuick] = useState<QuickFilter>("all");

  const regions = useMemo(
    () => Array.from(new Set(races.map((r) => r.region))).sort(),
    []
  );

  const filtered = useMemo(() => {
    return races
      .filter((race) => {
        if (!matchesQuick(race, quick)) return false;
        if (q) {
          const hay = `${race.name} ${race.location} ${race.region} ${race.description}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (region && race.region !== region) return false;
        if (surface && race.surface !== surface) return false;
        if (minDistance && !race.distancesKm.some((d) => d >= Number(minDistance))) return false;
        if (maxDistance && !race.distancesKm.some((d) => d <= Number(maxDistance))) return false;
        if (dateFrom && race.date < dateFrom) return false;
        if (dateTo && race.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [q, region, surface, minDistance, maxDistance, dateFrom, dateTo, quick]);

  const groups = useMemo(() => {
    const map = new Map<string, Race[]>();
    for (const race of filtered) {
      const [year, month] = race.date.split("-");
      const key = `${year}-${month}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(race);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const [year, month] = key.split("-");
      return { key, label: `${MONTH_NAMES[Number(month) - 1]} ${year}`, items };
    });
  }, [filtered]);

  return (
    <div>
      {/* Quick filters */}
      <div className="quick-filters">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`qf-pill${quick === f.id ? " active" : ""}`}
            onClick={() => setQuick(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Detailed filters row 1 */}
      <div className="filters">
        <div className="filter-field">
          <label>Search</label>
          <input
            type="text"
            placeholder="name, town, region…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Surface</label>
          <select value={surface} onChange={(e) => setSurface(e.target.value)}>
            <option value="">All</option>
            <option value="road">Road</option>
            <option value="trail">Trail</option>
            <option value="track">Track</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div className="filter-field">
          <label>Min distance (km)</label>
          <input type="number" min={0} value={minDistance} onChange={(e) => setMinDistance(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>Max distance (km)</label>
          <input type="number" min={0} value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
        </div>
      </div>

      {/* Detailed filters row 2 */}
      <div className="filters-row2">
        <div className="filter-field">
          <label>From date</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>To date</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="result-bar">
        <p className="result-count"><strong>{filtered.length}</strong> races found</p>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="month-group">
          <div className="month-heading">
            <span className="month-heading-text">{group.label}</span>
            <div className="month-heading-line" />
            <span className="month-heading-count">{group.items.length}</span>
          </div>
          <div className="race-table">
            {group.items.map((race) => {
              const { day, weekday } = formatDay(race.date);
              return (
                <a key={race.id} href={`/race/${race.id}`} className="race-row">
                  <div className="race-row-date">
                    <span className="race-row-day">{day}</span>
                    <span className="race-row-weekday">{weekday}</span>
                  </div>
                  <div className="race-row-main">
                    <div className="race-row-name">{race.name}</div>
                    <div className="race-row-location">{race.location} · {race.region}</div>
                  </div>
                  <div className="race-row-tags">
                    <span className={`tag tag-surface-${race.surface}`}>{race.surface}</span>
                    <span className="tag tag-dist">{fmtDistances(race.distancesKm)}</span>
                    {race.itraPoints != null && (
                      <span className="tag tag-itra">ITRA {race.itraPoints}pts</span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="empty">No races match your filters.</div>
      )}
    </div>
  );
}
