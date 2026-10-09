"use client";

import { useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type QuickFilter = "all" | "road" | "trail" | "mixed" | "short" | "half" | "marathon" | "ultra";

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all",      label: "All" },
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

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
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
    <div className="page">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            type="text"
            placeholder="Search races, locations…"
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
          <input className="tb-input-date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="date-sep">–</span>
          <input className="tb-input-date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
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
      </div>

      {/* Result count */}
      <div className="result-bar">
        <span className="result-count">{filtered.length} races</span>
      </div>

      {/* Race list */}
      <div className="race-list">
        {groups.map((group) => (
          <div key={group.key} className="month-block">
            <div className="month-row">
              <span className="month-label">{group.label}</span>
              <span className="month-count">{group.items.length}</span>
            </div>
            {group.items.map((race) => (
              <a key={race.id} href={`/race/${race.id}`} className="race-row">
                <span className="col-date">{fmtDate(race.date)}</span>
                <span className="col-name">{race.name}</span>
                <span className="col-loc">{[race.location, race.region].filter(Boolean).join(", ")}</span>
                <span className="col-tags">
                  {race.surface && <span className={`badge badge-${race.surface}`}>{race.surface}</span>}
                  <span className="badge badge-dist">{fmtDistances(race.distancesKm)}</span>
                  {race.itraPoints != null && <span className="badge badge-itra">ITRA {race.itraPoints}p</span>}
                </span>
              </a>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty">No races match your filters.</div>
        )}
      </div>
    </div>
  );
}
