import { notFound } from "next/navigation";
import { getAllRaces, getRace } from "@/lib/races";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ id: race.id }));
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function fmtDistances(dists: number[]) {
  return dists.map((d) => (Number.isInteger(d) ? d : d.toFixed(1))).join(" / ") + " km";
}

function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function RaceDetailPage({ params }: { params: { id: string } }) {
  const race = getRace(params.id);
  if (!race) notFound();

  const surfaceLabel: Record<string, string> = {
    road: "Road", trail: "Trail", track: "Track", mixed: "OCR / Mixed",
  };

  return (
    <div>
      <a href="/" className="back-link">← Back to calendar</a>

      <div className="race-detail">
        {/* Top badges */}
        <div className="detail-badges">
          {race.surface && (
            <span className={`badge b-${race.surface}`}>{surfaceLabel[race.surface] ?? race.surface}</span>
          )}
          {race.itraPoints != null && (
            <span className="badge b-itra">ITRA · {race.itraPoints} pts</span>
          )}
        </div>

        <h1>{race.name}</h1>

        {/* Key info grid */}
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-item-label">Date</div>
            <div className="detail-item-value">{fmtDate(race.date)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Distance{race.distancesKm.length > 1 ? "s" : ""}</div>
            <div className="detail-item-value">{fmtDistances(race.distancesKm)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Location</div>
            <div className="detail-item-value">{[race.location, race.region].filter(Boolean).join(", ") || "—"}</div>
          </div>
          {race.elevationGainM != null && (
            <div className="detail-item">
              <div className="detail-item-label">Elevation gain</div>
              <div className="detail-item-value">{race.elevationGainM} m ↑</div>
            </div>
          )}
        </div>

        {race.description && (
          <p className="detail-desc">{race.description}</p>
        )}

        {/* Website link */}
        {race.website && (
          <a href={race.website} target="_blank" rel="noopener noreferrer" className="detail-website-btn">
            {race.source === "behej.com" ? "View on Behej.com →" : "Official website →"}
          </a>
        )}
      </div>
    </div>
  );
}
