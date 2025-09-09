import React from "react";

interface JobBoardCardProps {
  id: string;
  title: string;
  locationName: string[];
  ghSlug: string;
}

export function JobBoardCard({
  id,
  title,
  locationName,
  ghSlug,
}: JobBoardCardProps) {
  return (
    <li className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-base-content/70">
          {Array.isArray(locationName) ? locationName.join(", ") : locationName}
        </p>
        <div className="card-actions justify-end">
          <a
            href={`/careers-portal-kv/jobs/${ghSlug}/${id}`}
            className="btn btn-primary btn-sm"
          >
            View Job
          </a>
        </div>
      </div>
    </li>
  );
}
