import { notFound } from "next/navigation";
import { getAllRaces, getRace } from "@/lib/races";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ id: race.id }));
}

function fmtDistances(dists: number[]) {
  return dists.map((d) => (Number.isInteger(d) ? d : d.toFixed(1))).join(" / ") + " km";
}

export default function RaceDetailPage({ params }: { params: { id: string } }) {
  const race = getRace(params.id);
  if (!race) notFound();

  return (
    <div>
      <a href="/" className="back-link">← back to calendar</a>
      <div className="race-detail">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className={`tag tag-surface-${race.surface}`}>{race.surface}</span>
          {race.itraPoints != null && (
            <span className="tag tag-itra">ITRA {race.itraPoints} pts</span>
          )}
        </div>
        <h1>{race.name}</h1>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-item-label">Date</div>
            <div className="detail-item-value">{race.date}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Location</div>
            <div className="detail-item-value">{race.location}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Region</div>
            <div className="detail-item-value">{race.region}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Distances</div>
            <div className="detail-item-value">{fmtDistances(race.distancesKm)}</div>
          </div>
          {race.elevationGainM != null && (
            <div className="detail-item">
              <div className="detail-item-label">Elevation gain</div>
              <div className="detail-item-value">{race.elevationGainM} m</div>
            </div>
          )}
        </div>
        <p className="detail-desc">{race.description}</p>
        {race.website && (
          <a href={race.website} target="_blank" rel="noopener noreferrer" className="detail-link">
            Official website →
          </a>
        )}
      </div>
    </div>
  );
}
