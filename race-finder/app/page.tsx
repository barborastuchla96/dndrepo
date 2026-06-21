"use client";

import { useEffect, useMemo, useState } from "react";
import { Race } from "@/lib/types";
import allRaces from "@/data/races.json";

const races = allRaces as Race[];

const SURFACES = ["road", "trail", "track", "mixed"];

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

      <div className="race-list">
        {filtered.map((race) => (
          <a key={race.id} href={`/race/${race.id}`} className="race-card">
            <div className="race-card-top">
              <span className="race-name">{race.name}</span>
              <span className="race-date">{race.date}</span>
            </div>
            <div className="race-meta">
              <span>{race.location}</span>
              <span className="tag">{race.region}</span>
              <span className="tag">{race.surface}</span>
              <span className="tag">{race.distancesKm.join(" / ")} km</span>
            </div>
          </a>
        ))}
        {filtered.length === 0 && <p>No races match your filters.</p>}
      </div>
    </div>
  );
}
