"use client";

import { useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type QuickFilter = "all" | "road" | "trail" | "mixed" | "short" | "half" | "marathon" | "ultra";

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "road",     label: "Road" },
  { id: "trail",    label: "Trail" },
  { id: "mixed",    label: "OCR" },
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

function getToday() { return new Date().toISOString().slice(0, 10); }
function in3Months() {
  const d = new Date(); d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function parseDateParts(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return { d, day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), weekday: d.getDay() };
}

function fmtDistances(dists: number[]) {
  return dists.map((d) => (Number.isInteger(d) ? d : d.toFixed(1))).join(" / ") + " km";
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [surface, setSurface] = useState("");
  const [minKm, setMinKm] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [dateFrom, setDateFrom] = useState(getToday);
  const [dateTo, setDateTo] = useState(in3Months);
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
        if (minKm && !race.distancesKm.some((d) => d >= Number(minKm))) return false;
        if (maxKm && !race.distancesKm.some((d) => d <= Number(maxKm))) return false;
        if (dateFrom && race.date < dateFrom) return false;
        if (dateTo && race.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [q, region, surface, minKm, maxKm, dateFrom, dateTo, quick]);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, Race[]>();
    for (const race of filtered) {
      if (!map.has(race.date)) map.set(race.date, []);
      map.get(race.date)!.push(race);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [filtered]);

  // Group dates by month for month headers
  const months = useMemo(() => {
    const map = new Map<string, typeof groups>();
    for (const g of groups) {
      const key = g.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return Array.from(map.entries()).map(([key, dateGroups]) => {
      const [year, month] = key.split("-");
      return { key, label: `${MONTHS[Number(month) - 1]} ${year}`, dateGroups };
    });
  }, [groups]);

  function clearAll() {
    setQ(""); setRegion(""); setSurface(""); setMinKm(""); setMaxKm("");
    setDateFrom(""); setDateTo("");
  }

  return (
    <div className="page">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-row">
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
            <option value="mixed">Mixed / OCR</option>
          </select>
          <input className="tb-num" type="number" min={0} placeholder="Min km" value={minKm} onChange={(e) => setMinKm(e.target.value)} />
          <input className="tb-num" type="number" min={0} placeholder="Max km" value={maxKm} onChange={(e) => setMaxKm(e.target.value)} />
          <input className="tb-date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="dash">–</span>
          <input className="tb-date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(q || region || surface || minKm || maxKm) && (
            <button className="clear-btn" onClick={clearAll}>Clear</button>
          )}
        </div>
        <div className="pill-row">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`pill${quick === f.id ? " pill-on" : ""}`}
              onClick={() => setQuick(f.id)}
            >{f.label}</button>
          ))}
          <span className="result-inline">{filtered.length} races</span>
          <button className="link-btn" onClick={() => { setDateFrom(""); setDateTo(""); }}>All dates</button>
        </div>
      </div>

      {/* List */}
      <div className="race-list">
        {months.map((month) => (
          <div key={month.key} className="month-block">
            <div className="month-hd">{month.label}</div>
            {month.dateGroups.map(({ date, items }) => {
              const { day, month: mo, year, weekday } = parseDateParts(date);
              const isToday = date === getToday();
              return (
                <div key={date} className="date-block">
                  <div className={`date-hd${isToday ? " date-hd-today" : ""}`}>
                    <span className="date-hd-day">{day}</span>
                    <div className="date-hd-right">
                      <span className="date-hd-weekday">{DAYS[weekday]}</span>
                      <span className="date-hd-month">{MONTHS_SHORT[mo]} {year}</span>
                    </div>
                    <span className="date-hd-count">{items.length} race{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="race-rows">
                    {items.map((race) => (
                      <a key={race.id} href={`/race/${race.id}`} className="race-row">
                        <div className="row-name">{race.name}</div>
                        <div className="row-loc">{[race.location, race.region].filter(Boolean).join(", ")}</div>
                        <div className="row-right">
                          {race.surface && <span className={`badge b-${race.surface}`}>{race.surface}</span>}
                          {race.itraPoints != null && <span className="badge b-itra">ITRA</span>}
                          <span className="row-dist">{fmtDistances(race.distancesKm)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty">
            No races found. <button className="link-btn" onClick={clearAll}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
