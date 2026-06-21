export type Surface = "road" | "trail" | "track" | "mixed";

export interface Race {
  id: string;
  name: string;
  date: string; // ISO date, YYYY-MM-DD
  region: string; // Czech region, e.g. "Praha", "Jihomoravský kraj"
  location: string; // town/venue
  distancesKm: number[]; // e.g. [5, 10, 21.1]
  surface: Surface;
  elevationGainM?: number;
  description: string;
  website?: string;
  source: string; // where this entry came from
}
