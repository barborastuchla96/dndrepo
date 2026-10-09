"use client";

import { useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type QuickFilter = "all"|"road"|"trail"|"mixed"|"short"|"half"|"marathon"|"ultra";
const QUICK_FILTERS: {id: QuickFilter; label: string}[] = [
  {id:"all", label:"All"},
  {id:"road", label:"Road"},
  {id:"trail", label:"Trail"},
  {id:"mixed", label:"OCR"},
  {id:"short", label:"≤10 km"},
  {id:"half", label:"Half"},
  {id:"marathon", label:"Marathon"},
  {id:"ultra", label:"Ultra"},
];

function matchesQuick(race: Race, qf: QuickFilter) {
  if (qf === "all") return true;
  if (qf === "road") return race.surface === "road";
  if (qf === "trail") return race.surface === "trail";
  if (qf === "mixed") return race.surface === "mixed";
  if (qf === "short") return race.distancesKm.some(d => d <= 10);
  if (qf === "half") return race.distancesKm.some(d => d >= 20 && d <= 22);
  if (qf === "marathon") return race.distancesKm.some(d => d >= 40 && d <= 45);
  if (qf === "ultra") return race.distancesKm.some(d => d >= 50);
  return true;
}

const today = new Date().toISOString().slice(0, 10);
function in3m() { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().slice(0,10); }

function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.`;
}

function fmtDist(dists: number[]) {
  return dists.map(d => Number.isInteger(d) ? d : d.toFixed(1)).join(" / ") + " km";
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [surface, setSurface] = useState("");
  const [minKm, setMinKm] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(in3m);
  const [quick, setQuick] = useState<QuickFilter>("all");

  const regions = useMemo(() =>
    Array.from(new Set(races.map(r => r.region).filter(Boolean))).sort(), []);

  const filtered = useMemo(() =>
    races.filter(race => {
      if (!matchesQuick(race, quick)) return false;
      if (q && !`${race.name} ${race.location} ${race.region}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (region && race.region !== region) return false;
      if (surface && race.surface !== surface) return false;
      if (minKm && !race.distancesKm.some(d => d >= +minKm)) return false;
      if (maxKm && !race.distancesKm.some(d => d <= +maxKm)) return false;
      if (dateFrom && race.date < dateFrom) return false;
      if (dateTo && race.date > dateTo) return false;
      return true;
    }).sort((a,b) => a.date.localeCompare(b.date)),
  [q, region, surface, minKm, maxKm, dateFrom, dateTo, quick]);

  // Group by month → dates → races
  const months = useMemo(() => {
    const monthMap = new Map<string, Map<string, Race[]>>();
    for (const race of filtered) {
      const mk = race.date.slice(0,7);
      if (!monthMap.has(mk)) monthMap.set(mk, new Map());
      const dm = monthMap.get(mk)!;
      if (!dm.has(race.date)) dm.set(race.date, []);
      dm.get(race.date)!.push(race);
    }
    return Array.from(monthMap.entries()).map(([mk, dm]) => {
      const [y, m] = mk.split("-");
      return {
        key: mk,
        label: `${MONTHS[+m-1]} ${y}`,
        dates: Array.from(dm.entries()).map(([date, items]) => ({ date, items })),
        count: Array.from(dm.values()).reduce((s, a) => s+a.length, 0),
      };
    });
  }, [filtered]);

  return (
    <div className="page">
      {/* Filters */}
      <div className="toolbar">
        <input className="search-input" type="text" placeholder="Search races or locations…"
          value={q} onChange={e => setQ(e.target.value)} />
        <select className="tb-select" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="tb-select" value={surface} onChange={e => setSurface(e.target.value)}>
          <option value="">All surfaces</option>
          <option value="road">Road</option>
          <option value="trail">Trail</option>
          <option value="mixed">Mixed / OCR</option>
        </select>
        <input className="tb-num" type="number" min={0} placeholder="Min km" value={minKm} onChange={e => setMinKm(e.target.value)} />
        <input className="tb-num" type="number" min={0} placeholder="Max km" value={maxKm} onChange={e => setMaxKm(e.target.value)} />
        <input className="tb-date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="dash">–</span>
        <input className="tb-date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="link-btn" onClick={() => { setDateFrom(""); setDateTo(""); }}>All dates</button>
      </div>

      <div className="pill-row">
        {QUICK_FILTERS.map(f => (
          <button key={f.id} className={`pill${quick===f.id?" pill-on":""}`} onClick={() => setQuick(f.id)}>
            {f.label}
          </button>
        ))}
        <span className="result-inline">{filtered.length} races</span>
      </div>

      {/* Table */}
      {months.length > 0 ? (
        <div className="table-wrap">
          <table className="race-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th>Race</th>
                <th>Location</th>
                <th className="col-surface">Surface</th>
                <th className="col-dist">Distance</th>
              </tr>
            </thead>
            {months.map(month => (
              <tbody key={month.key}>
                <tr>
                  <td colSpan={5} style={{padding:0}}>
                    <div className="month-divider">
                      <span className="month-divider-label">{month.label}</span>
                      <span className="month-divider-count">{month.count}</span>
                    </div>
                  </td>
                </tr>
                {month.dates.map(({ date, items }) =>
                  items.map((race, i) => (
                    <tr key={race.id} className={i===0?"date-first":""} onClick={() => window.location.href=`/race/${race.id}`}>
                      <td className="col-date">{i===0 ? fmtDate(date) : ""}</td>
                      <td className="col-name">{race.name}</td>
                      <td className="col-loc">{[race.location, race.region].filter(Boolean).join(", ")}</td>
                      <td className="col-surface">
                        {race.surface && <span className={`badge b-${race.surface}`}>{race.surface}</span>}
                      </td>
                      <td className="col-dist">{fmtDist(race.distancesKm)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            ))}
          </table>
        </div>
      ) : (
        <div className="empty">No races found. <button className="link-btn" onClick={() => { setQ(""); setRegion(""); setSurface(""); setMinKm(""); setMaxKm(""); setDateFrom(""); setDateTo(""); }}>Clear all filters</button></div>
      )}
    </div>
  );
}
