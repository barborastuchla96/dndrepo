export type Surface = "road" | "trail" | "track" | "mixed";

export interface Race {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  region: string;
  location: string;
  distancesKm: number[];
  surface: Surface;
  elevationGainM?: number;
  description: string;
  website?: string;
  itraPoints?: number; // ITRA race points if listed on itra.run
  source: string;
}
