"use client";

import React, { useState, useEffect } from "react";
import type { GreenhouseDepartment } from "../../lib/greenhouse";
import { Job } from "../../../devlink/Job";
import { JobsList } from "../../../devlink/JobsList";
import { Department } from "../../../devlink/Department";

interface JobsPageProps {
  ghSlug?: string;
  className?: string;
}

interface DepartmentsResponse {
  departments: GreenhouseDepartment[];
}

export function JobsPage({
  ghSlug = "webflow",
  className = "",
}: JobsPageProps) {
  const [departments, setDepartments] = useState<GreenhouseDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Fetch departments and jobs
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/careers-portal/api/greenhouse?ghSlug=${encodeURIComponent(ghSlug)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch job listings");
        }

        const data: DepartmentsResponse = await response.json();
        setDepartments(data.departments || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load job listings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [ghSlug]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };

  // Filter departments based on selection
  const filteredDepartments = departments.filter((dept) => {
    if (selectedDepartment === "all") return dept.jobs.length > 0;
    return String(dept.id) === selectedDepartment && dept.jobs.length > 0;
  });

  // Calculate total jobs
  const totalJobs = departments.reduce(
    (total, dept) => total + dept.jobs.length,
    0
  );

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-lg">Loading job listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`alert alert-error ${className}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap={"round" as const}
            strokeLinejoin={"round" as const}
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-xl text-base-content/60">
          No job listings found for this organization.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Department Filter */}
      <div className="flex items-center justify-center gap-4 p-4 bg-base-200 rounded-lg">
        <label htmlFor="department-filter" className="label">
          <span className="label-text font-medium">Filter by department:</span>
        </label>
        <select
          id="department-filter"
          value={selectedDepartment}
          onChange={handleFilterChange}
          className="select select-bordered bg-base-100 text-base-content min-w-48"
        >
          <option value="all">All Departments ({totalJobs} jobs)</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name} ({dept.jobs.length} jobs)
            </option>
          ))}
        </select>
      </div>
      <div className="text-center">
        <div className="mt-4 text-sm text-base-content/60">
          {totalJobs} open positions across {departments.length} departments
        </div>
      </div>

      {/* Job Listings using DevLink Components */}
      <JobsList
        department={
          <div className="space-y-0">
            {filteredDepartments.map((dept) => (
              <Department
                key={dept.id}
                title={dept.name}
                jobs={
                  <div className="space-y-0">
                    {dept.jobs.map((job) => (
                      <Job
                        key={job.id}
                        title={job.title}
                        location={job.location.name}
                        link={{
                          href: `/careers-portal/jobs/${ghSlug}/${job.id}`,
                        }}
                      />
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        }
      />

      {/* No Results Message */}
      {filteredDepartments.length === 0 && selectedDepartment !== "all" && (
        <div className="text-center py-12">
          <div className="text-xl text-base-content/60">
            No jobs found in the selected department.
          </div>
          <button
            onClick={() => setSelectedDepartment("all")}
            className="btn btn-primary btn-sm mt-4"
          >
            View All Jobs
          </button>
        </div>
      )}
    </div>
  );
}
