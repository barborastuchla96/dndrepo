import { NextRequest, NextResponse } from "next/server";
import { filterRaces } from "@/lib/races";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const minDistance = params.get("minDistance");
  const maxDistance = params.get("maxDistance");

  const races = filterRaces({
    q: params.get("q") ?? undefined,
    region: params.get("region") ?? undefined,
    surface: params.get("surface") ?? undefined,
    minDistance: minDistance ? Number(minDistance) : undefined,
    maxDistance: maxDistance ? Number(maxDistance) : undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });

  return NextResponse.json(races);
}
