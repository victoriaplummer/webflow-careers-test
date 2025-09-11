export interface WarmCacheRequestBody {
  ghSlug?: string;
  includeJobDetails?: boolean;
  maxJobs?: number;
  type?: "all" | "departments" | "jobs" | "jobDetails";
}

export interface InvalidateCacheRequestBody {
  type?: string;
  ghSlug?: string;
  jobId?: string;
  departmentId?: string;
}
