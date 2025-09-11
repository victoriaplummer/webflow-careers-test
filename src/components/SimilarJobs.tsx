import type { GreenhouseDepartment } from "../lib/greenhouse";
import { JobBoardCard } from "./JobBoardCard";

// Type declarations for HTML elements
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      ul: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLUListElement>,
        HTMLUListElement
      >;
      li: React.DetailedHTMLProps<
        React.LiHTMLAttributes<HTMLLIElement>,
        HTMLLIElement
      >;
    }
  }
}

interface SimilarJobsProps {
  department: GreenhouseDepartment;
  currentJobId: number;
  ghSlug: string;
}

export const SimilarJobs = ({
  department,
  currentJobId,
  ghSlug,
}: SimilarJobsProps) => {
  // Filter out the current job and limit to 3 similar jobs
  const similarJobs = department.jobs
    .filter((job) => job.id !== currentJobId)
    .slice(0, 3);

  // Don't render if no similar jobs
  if (similarJobs.length === 0) {
    return null;
  }

  return (
    <div className="webflow-similar-jobs card">
      <div className="card-body">
        <h2 className="webflow-section-title card-title text-2xl mb-4">
          Other Jobs in {department.name}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {similarJobs.map((job) => (
            <JobBoardCard
              key={job.id}
              id={job.id.toString()}
              title={job.title}
              locationName={
                job?.location?.name?.replace(" only", "").split(";") || []
              }
              ghSlug={ghSlug}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
