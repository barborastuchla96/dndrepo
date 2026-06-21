"use client";

import { useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const SURFACES = ["road", "trail", "track", "mixed"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  return { day: d.getDate(), weekday };
}

export default function HomePage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [surface, setSurface] = useState("");
  const [minDistance, setMinDistance] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const regions = useMemo(
    () => Array.from(new Set(races.map((r) => r.region))).sort(),
    []
  );

  const filtered = useMemo(() => {
    return races
      .filter((race) => {
        if (q) {
          const haystack = `${race.name} ${race.location} ${race.description}`.toLowerCase();
          if (!haystack.includes(q.toLowerCase())) return false;
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
  }, [q, region, surface, minDistance, maxDistance, dateFrom, dateTo]);

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
      <div className="filters">
        <label>
          Search
          <input
            type="text"
            placeholder="name, town, description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Surface
          <select value={surface} onChange={(e) => setSurface(e.target.value)}>
            <option value="">All surfaces</option>
            {SURFACES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Min distance (km)
          <input
            type="number"
            min={0}
            value={minDistance}
            onChange={(e) => setMinDistance(e.target.value)}
          />
        </label>
        <label>
          Max distance (km)
          <input
            type="number"
            min={0}
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
          />
        </label>
        <label>
          From date
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          To date
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      <p className="result-count">{filtered.length} races found</p>

      {groups.map((group) => (
        <section key={group.key} className="month-group">
          <h2 className="month-heading">{group.label}</h2>
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
                    <div className="race-row-location">{race.location}</div>
                  </div>
                  <div className="race-row-tags">
                    <span className={`tag tag-surface-${race.surface}`}>{race.surface}</span>
                    <span className="tag">{race.distancesKm.join(" / ")} km</span>
                    <span className="tag tag-region">{race.region}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <p>No races match your filters.</p>}
    </div>
  );
}
