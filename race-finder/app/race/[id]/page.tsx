import { notFound } from "next/navigation";
import { getAllRaces, getRace } from "@/lib/races";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ id: race.id }));
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDist(dists: number[]) {
  return dists.map(d => Number.isInteger(d) ? d : d.toFixed(1)).join(" / ") + " km";
}

const SURFACE_LABEL: Record<string, string> = {
  road: "Road", trail: "Trail", track: "Track", mixed: "OCR / Mixed",
};

export default function RaceDetailPage({ params }: { params: { id: string } }) {
  const race = getRace(params.id);
  if (!race) notFound();

  const surface = race.surface ?? "road";

  return (
    <div className="detail-page">
      <a href="/" className="back-link">← Back to calendar</a>

      <div className={`detail-card surface-${surface}`}>
        {/* Accent stripe */}
        <div className="detail-stripe" />

        <div className="detail-inner">
          {/* Header */}
          <div className="detail-header">
            <span className={`badge b-${surface}`}>{SURFACE_LABEL[surface] ?? surface}</span>
            {race.itraPoints != null && <span className="badge b-itra">ITRA · {race.itraPoints} pts</span>}
          </div>

          <h1 className="detail-title">{race.name}</h1>

          {/* Key facts */}
          <div className="detail-facts">
            <div className="fact">
              <span className="fact-icon">📅</span>
              <div>
                <div className="fact-label">Date</div>
                <div className="fact-value">{fmtDate(race.date)}</div>
              </div>
            </div>
            <div className="fact">
              <span className="fact-icon">📍</span>
              <div>
                <div className="fact-label">Location</div>
                <div className="fact-value">{[race.location, race.region].filter(Boolean).join(", ") || "—"}</div>
              </div>
            </div>
            <div className="fact">
              <span className="fact-icon">📏</span>
              <div>
                <div className="fact-label">Distance{race.distancesKm.length > 1 ? "s" : ""}</div>
                <div className="fact-value">{fmtDist(race.distancesKm)}</div>
              </div>
            </div>
            {race.elevationGainM != null && (
              <div className="fact">
                <span className="fact-icon">⛰️</span>
                <div>
                  <div className="fact-label">Elevation</div>
                  <div className="fact-value">{race.elevationGainM} m ↑</div>
                </div>
              </div>
            )}
          </div>

          {race.description && race.description.length > 3 && (
            <p className="detail-desc">{race.description}</p>
          )}

          {race.website && (
            <a href={race.website} target="_blank" rel="noopener noreferrer" className="detail-cta">
              {race.source === "behej.com" ? "View on Behej.com" : "Official website"} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
