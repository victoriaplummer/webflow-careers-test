"use client";

import React, { useState, useEffect } from "react";
import type { GreenhouseJob } from "../../lib/greenhouse";

interface FeaturedJobsSliderProps {
  jobIds: string; // Comma-separated list of job IDs
  ghSlug?: string;
  className?: string;
  autoPlayInterval?: number;
  domain?: string;
}

interface JobCardProps {
  job: GreenhouseJob;
  ghSlug: string;
}

function JobCard({ job, ghSlug }: JobCardProps) {
  const getDepartmentName = () => {
    if (job.departments && job.departments.length > 0) {
      return job.departments[0].name;
    }
    return "General";
  };

  const getLocationName = () => {
    if (job.location && job.location.name) {
      return job.location.name;
    }
    if (job.offices && job.offices.length > 0) {
      return job.offices[0].name;
    }
    return "Remote";
  };

  return (
    <a
      href={`/careers-portal/jobs/${ghSlug}/${job.id}`}
      style={{
        display: "block",
        position: "relative",
        padding: "1.5rem",
        height: "100%",
        minHeight: "200px",
        cursor: "pointer",
        backgroundColor: "#171717",
        color: "white",
        borderRadius: "0.25rem",
        transition: "all 0.3s cubic-bezier(.165, .84, .44, 1)",
        textDecoration: "none",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.backgroundColor = "#1f2937";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.backgroundColor = "#171717";
      }}
    >
      {/* Arrow Icon - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          opacity: 0.6,
          color: "white",
          transition: "opacity 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.6";
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: "white" }}
        >
          <path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap={"round" as const}
            strokeLinejoin={"round" as const}
          />
        </svg>
      </div>

      {/* Department Badge - Top Left */}
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "500",
          marginBottom: "1rem",
          opacity: 0.8,
          color: "white",
        }}
      >
        {getDepartmentName()}
      </div>

      {/* Job Title */}
      <h3
        style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          lineHeight: "1.25",
          marginBottom: "0.5rem",
          color: "white",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {job.title}
      </h3>

      {/* Location */}
      <div
        style={{
          fontSize: "0.875rem",
          opacity: 0.7,
          color: "white",
        }}
      >
        {getLocationName()}
      </div>
    </a>
  );
}

export function FeaturedJobsSlider({
  jobIds,
  ghSlug = "webflow",
  className = "",
  autoPlayInterval = 5000,
  domain = "https://webflow-about-1c3d6c3166e82678aba90676e.webflow.io",
}: FeaturedJobsSliderProps) {
  const [jobs, setJobs] = useState<GreenhouseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse job IDs from comma-separated string
  const jobIdArray = jobIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      if (jobIdArray.length === 0) {
        setError("No job IDs provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all departments from the API
        const response = await fetch(
          `${domain}/careers-portal/api/greenhouse?ghSlug=${encodeURIComponent(
            ghSlug
          )}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch departments: ${response.status}`);
        }

        const data = (await response.json()) as { departments: any[] };
        const allDepartments = data.departments || [];

        // Extract all jobs from all departments and filter by job IDs
        const allJobs: any[] = [];
        allDepartments.forEach((dept) => {
          if (dept.jobs && dept.jobs.length > 0) {
            // Add department information to each job
            dept.jobs.forEach((job: any) => {
              allJobs.push({
                ...job,
                departments: [{ id: dept.id, name: dept.name }],
              });
            });
          }
        });

        // Filter jobs based on provided job IDs
        const featuredJobs = allJobs.filter((job) =>
          jobIdArray.includes(job.id.toString())
        );

        setJobs(featuredJobs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load featured jobs"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [jobIds, ghSlug, domain]);

  // Create duplicated jobs for seamless infinite scroll
  const duplicatedJobs = jobs.length > 0 ? [...jobs, ...jobs] : [];

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-600">Loading featured jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md ${className}`}
      >
        <span className="text-2xl">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-xl text-gray-500">No featured jobs found.</div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Job Cards Container - Smooth News Ticker */}
      <div
        style={{
          overflow: "hidden",
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: `${(duplicatedJobs.length / 3) * 100}%`,
            animation: `scroll-${autoPlayInterval} ${autoPlayInterval}ms linear infinite`,
            position: "relative",
          }}
        >
          {duplicatedJobs.map((job, index) => (
            <div
              key={`${job.id}-${index}`}
              style={{
                flexShrink: 0,
                width: `${100 / duplicatedJobs.length}%`,
                minHeight: "200px",
                paddingLeft: index === 0 ? "0" : "0.375rem",
                paddingRight:
                  index === duplicatedJobs.length - 1 ? "0" : "0.375rem",
                boxSizing: "border-box",
              }}
            >
              <JobCard job={job} ghSlug={ghSlug} />
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation for smooth scrolling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes scroll-${autoPlayInterval} {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `,
        }}
      />
    </div>
  );
}
