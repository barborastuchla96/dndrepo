import { notFound } from "next/navigation";
import { getAllRaces, getRace } from "@/lib/races";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ id: race.id }));
}

export default function RaceDetailPage({ params }: { params: { id: string } }) {
  const race = getRace(params.id);
  if (!race) notFound();

  return (
    <div>
      <a href="/" className="back-link">
        ← back to search
      </a>
      <div className="race-detail">
        <h1>{race.name}</h1>
        <p className="detail-row">
          <strong>Date:</strong> {race.date}
        </p>
        <p className="detail-row">
          <strong>Location:</strong> {race.location} ({race.region})
        </p>
        <p className="detail-row">
          <strong>Distances:</strong> {race.distancesKm.join(", ")} km
        </p>
        <p className="detail-row">
          <strong>Surface:</strong> {race.surface}
        </p>
        {race.elevationGainM != null && (
          <p className="detail-row">
            <strong>Elevation gain:</strong> {race.elevationGainM} m
          </p>
        )}
        <p className="detail-row">
          <strong>Description:</strong> {race.description}
        </p>
        {race.website && (
          <p className="detail-row">
            <strong>Website:</strong>{" "}
            <a href={race.website} target="_blank" rel="noopener noreferrer">
              {race.website}
            </a>
          </p>
        )}
        <p className="detail-row">
          <strong>Source:</strong> {race.source}
        </p>
      </div>
    </div>
  );
}
