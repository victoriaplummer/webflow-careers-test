import { useEffect } from "react";
import { API_ENDPOINTS } from "../lib/config";

interface CachePreloaderProps {
  ghSlug: string;
  jobId?: string;
}

export function CachePreloader({ ghSlug, jobId }: CachePreloaderProps) {
  useEffect(() => {
    // Preload related data in the background
    const preloadData = async () => {
      try {
        // Preload all jobs for faster navigation
        const allJobsPromise = fetch(
          `/careers-portal-kv/api/jobs?ghSlug=${encodeURIComponent(ghSlug)}`
        );

        // If we're on a job page, preload similar jobs
        if (jobId) {
          const questionsPromise = fetch(
            `/careers-portal-kv/api/questions?ghSlug=${encodeURIComponent(
              ghSlug
            )}&jobId=${encodeURIComponent(jobId)}`
          );

          // Wait for both to complete
          await Promise.allSettled([allJobsPromise, questionsPromise]);
        } else {
          // Just preload jobs list
          await allJobsPromise;
        }
      } catch (error) {
        // Silently fail - this is just preloading
        console.debug("Cache preloading failed:", error);
      }
    };

    // Delay preloading to not interfere with initial page load
    const timeout = setTimeout(preloadData, 1000);

    return () => clearTimeout(timeout);
  }, [ghSlug, jobId]);

  return null; // This component doesn't render anything
}
