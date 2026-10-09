import { Race } from "./types";
import raceData from "@/data/races.json";

const races = raceData as Race[];

export interface RaceFilters {
  q?: string;
  region?: string;
  surface?: string;
  minDistance?: number;
  maxDistance?: number;
  dateFrom?: string;
  dateTo?: string;
}

export function getAllRaces(): Race[] {
  return [...races].sort((a, b) => a.date.localeCompare(b.date));
}

export function getRace(id: string): Race | undefined {
  return races.find((r) => r.id === id);
}

export function getRegions(): string[] {
  return Array.from(new Set(races.map((r) => r.region))).sort();
}

export function filterRaces(filters: RaceFilters): Race[] {
  return getAllRaces().filter((race) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const haystack = `${race.name} ${race.location} ${race.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.region && race.region !== filters.region) return false;
    if (filters.surface && race.surface !== filters.surface) return false;
    if (filters.minDistance != null) {
      if (!race.distancesKm.some((d) => d >= filters.minDistance!)) return false;
    }
    if (filters.maxDistance != null) {
      if (!race.distancesKm.some((d) => d <= filters.maxDistance!)) return false;
    }
    if (filters.dateFrom && race.date < filters.dateFrom) return false;
    if (filters.dateTo && race.date > filters.dateTo) return false;
    return true;
  });
}
