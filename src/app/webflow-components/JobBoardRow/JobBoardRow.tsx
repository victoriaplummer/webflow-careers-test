import React from "react";

interface JobBoardRowProps {
  id: string;
  title: string;
  locationName: string[];
  ghSlug: string;
}

export function JobBoardRow({
  id,
  title,
  locationName,
  ghSlug,
}: JobBoardRowProps) {
  return (
    <li className="flex items-center justify-between p-4 bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-base-content/70">
          {Array.isArray(locationName) ? locationName.join(", ") : locationName}
        </p>
      </div>
      <div className="ml-4">
        <a
          href={`/careers-portal/jobs/${ghSlug}/${id}`}
          className="btn btn-primary btn-sm"
        >
          View Job
        </a>
      </div>
    </li>
  );
}
