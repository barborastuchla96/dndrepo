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
  { id: "all",      label: "All types" },
  { id: "road",     label: "Road" },
  { id: "trail",    label: "Trail" },
  { id: "mixed",    label: "OCR / Mixed" },
  { id: "short",    label: "≤10 km" },
  { id: "half",     label: "Half" },
  { id: "marathon", label: "Marathon" },
  { id: "ultra",    label: "Ultra" },
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function threeMonthsLater() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function fmtCardDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3).toUpperCase();
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  return { day, month, weekday };
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
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(threeMonthsLater);
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const regions = useMemo(
    () => Array.from(new Set(races.map((r) => r.region).filter(Boolean))).sort(),
    []
  );

  const filtered = useMemo(() => {
    return races
      .filter((race) => {
        if (!matchesQuick(race, quick)) return false;
        if (q) {
          const hay = `${race.name} ${race.location} ${race.region}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (region && race.region !== region) return false;
        if (surface && race.surface !== surface) return false;
        if (minDistance && !race.distancesKm.some((d) => d >= Number(minDistance))) return false;
        if (maxDistance && !race.distancesKm.some((d) => d <= Number(maxDistance))) return false;
        if (!showAll) {
          if (dateFrom && race.date < dateFrom) return false;
          if (dateTo && race.date > dateTo) return false;
        } else {
          if (dateFrom && race.date < dateFrom) return false;
          if (dateTo && race.date > dateTo) return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [q, region, surface, minDistance, maxDistance, dateFrom, dateTo, quick, showAll]);

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
    <div className="page">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-top">
          <input
            className="search-input"
            type="text"
            placeholder="Search races or locations…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="tb-select" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="tb-select" value={surface} onChange={(e) => setSurface(e.target.value)}>
            <option value="">All surfaces</option>
            <option value="road">Road</option>
            <option value="trail">Trail</option>
            <option value="track">Track</option>
            <option value="mixed">Mixed / OCR</option>
          </select>
          <input className="tb-input-sm" type="number" min={0} placeholder="Min km" value={minDistance} onChange={(e) => setMinDistance(e.target.value)} />
          <input className="tb-input-sm" type="number" min={0} placeholder="Max km" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
        </div>
        <div className="toolbar-bottom">
          <div className="pill-row">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`pill${quick === f.id ? " pill-active" : ""}`}
                onClick={() => setQuick(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="date-controls">
            <input className="tb-input-date" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setShowAll(false); }} />
            <span className="date-sep">–</span>
            <input className="tb-input-date" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setShowAll(false); }} />
            <button className="btn-show-all" onClick={() => { setShowAll(!showAll); setDateFrom(""); setDateTo(""); }}>
              {showAll ? "Show upcoming" : "Show all dates"}
            </button>
          </div>
        </div>
      </div>

      <div className="result-bar">
        <span className="result-count">{filtered.length} races</span>
        {!showAll && <span className="result-hint">— next 3 months · <button className="link-btn" onClick={() => { setShowAll(true); setDateFrom(""); setDateTo(""); }}>see all</button></span>}
      </div>

      {/* Race groups */}
      {groups.map((group) => (
        <section key={group.key} className="month-section">
          <h2 className="month-heading">{group.label} <span className="month-count">{group.items.length}</span></h2>
          <div className="card-grid">
            {group.items.map((race) => {
              const { day, month, weekday } = fmtCardDate(race.date);
              return (
                <a key={race.id} href={`/race/${race.id}`} className="race-card">
                  <div className="card-header">
                    <div className="card-date">
                      <span className="card-day">{day}</span>
                      <span className="card-month">{month}</span>
                    </div>
                    <div className="card-badges">
                      {race.surface && <span className={`badge badge-${race.surface}`}>{race.surface}</span>}
                      {race.itraPoints != null && <span className="badge badge-itra">ITRA</span>}
                    </div>
                  </div>
                  <div className="card-name">{race.name}</div>
                  <div className="card-meta">
                    <span className="card-loc">{[race.location, race.region].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="card-footer">
                    <span className="card-dist">{fmtDistances(race.distancesKm)}</span>
                    <span className="card-weekday">{weekday}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="empty">
          <p>No races found.</p>
          <button className="link-btn" onClick={() => { setShowAll(true); setDateFrom(""); setDateTo(""); setQ(""); }}>Clear all filters</button>
        </div>
      )}
    </div>
  );
}
