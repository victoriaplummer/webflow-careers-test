import { KVCache, CacheKeys, CacheTTL } from "./kvCache";

export interface GreenhouseJob {
  id: number;
  title: string;
  content?: string;
  updated_at?: string;
  location: {
    name: string;
  };
  departments: Array<{
    id: number;
    name: string;
  }>;
  offices: Array<{
    id: number;
    name: string;
    location: string;
  }>;
  questions?: Array<{
    id: number;
    label: string;
    required: boolean;
    fields: Array<{
      id: number;
      label: string;
      type: string;
      required: boolean;
    }>;
  }>;
  [key: string]: any;
}

interface DepartmentJobs {
  jobs: Array<{
    id: number;
    title: string;
    location: {
      name: string;
    };
    absolute_url: string;
  }>;
}

export interface GreenhouseDepartment {
  id: number;
  name: string;
  jobs: Array<{
    id: number;
    title: string;
    location: {
      name: string;
    };
    absolute_url: string;
  }>;
}

export interface GreenhouseQuestion {
  id: number;
  label: string;
  required: boolean;
  description?: string;
  name?: string;
  fields: Array<{
    id: number;
    label: string;
    name: string;
    type: string;
    required: boolean;
    values?: Array<{
      value: string;
      label: string;
    }>;
  }>;
}

export async function fetchGreenhouseJobWithQuestions(
  ghSlug: string,
  jobId: string
): Promise<GreenhouseJob | null> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      ghSlug
    )}/jobs/${encodeURIComponent(jobId)}?questions=true&pay_transparency=true`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Greenhouse API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const jobData = await response.json();
    return jobData as GreenhouseJob;
  } catch (error) {
    console.error("Error fetching job from Greenhouse:", error);
    return null;
  }
}

export async function fetchGreenhouseJobWithQuestionsCached(
  ghSlug: string,
  jobId: string,
  kv: KVNamespace
): Promise<GreenhouseJob | null> {
  const cache = new KVCache(kv);
  const cacheKey = CacheKeys.jobWithQuestions(ghSlug, jobId);

  return cache.getOrSet(
    cacheKey,
    () => fetchGreenhouseJobWithQuestions(ghSlug, jobId),
    CacheTTL.JOB_DETAILS
  );
}

export async function fetchGreenhouseJob(
  ghSlug: string,
  jobId: string
): Promise<GreenhouseJob | null> {
  return fetchGreenhouseJobWithQuestions(ghSlug, jobId);
}

export async function fetchGreenhouseJobCached(
  ghSlug: string,
  jobId: string,
  kv: KVNamespace
): Promise<GreenhouseJob | null> {
  return fetchGreenhouseJobWithQuestionsCached(ghSlug, jobId, kv);
}

export async function fetchDepartmentJobs(
  ghSlug: string,
  departmentId: number
): Promise<GreenhouseDepartment | null> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      ghSlug
    )}/departments/${departmentId}/jobs`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Greenhouse API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return data as GreenhouseDepartment;
  } catch (error) {
    console.error("Error fetching department jobs from Greenhouse:", error);
    return null;
  }
}

export async function fetchDepartmentJobsCached(
  ghSlug: string,
  departmentId: number,
  kv: KVNamespace
): Promise<GreenhouseDepartment | null> {
  const cache = new KVCache(kv);
  const cacheKey = CacheKeys.departmentJobs(ghSlug, departmentId);

  return cache.getOrSet(
    cacheKey,
    () => fetchDepartmentJobs(ghSlug, departmentId),
    CacheTTL.DEPARTMENT_JOBS
  );
}

export async function fetchAllJobs(ghSlug: string): Promise<GreenhouseJob[]> {
  try {
    // First, get all departments
    const departmentsUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      ghSlug
    )}/departments/`;

    const departmentsResponse = await fetch(departmentsUrl);
    if (!departmentsResponse.ok) {
      console.error(
        `Greenhouse API error: ${departmentsResponse.status} ${departmentsResponse.statusText}`
      );
      return [];
    }

    const departmentsData = (await departmentsResponse.json()) as {
      departments: any[];
    };
    const departments = departmentsData.departments || [];

    // Fetch jobs from all departments
    const allJobs: GreenhouseJob[] = [];

    for (const department of departments) {
      if (department.jobs && department.jobs.length > 0) {
        // Fetch detailed job information for each job
        for (const jobSummary of department.jobs) {
          try {
            const jobDetail = await fetchGreenhouseJob(
              ghSlug,
              jobSummary.id.toString()
            );
            if (jobDetail) {
              allJobs.push(jobDetail);
            }
          } catch (error) {
            console.error(`Error fetching job ${jobSummary.id}:`, error);
          }
        }
      }
    }

    return allJobs;
  } catch (error) {
    console.error("Error fetching all jobs from Greenhouse:", error);
    return [];
  }
}

export async function fetchAllJobsCached(
  ghSlug: string,
  kv: KVNamespace
): Promise<GreenhouseJob[]> {
  const cache = new KVCache(kv);
  const cacheKey = CacheKeys.allJobs(ghSlug);

  return cache.getOrSet(
    cacheKey,
    () => fetchAllJobs(ghSlug),
    CacheTTL.ALL_JOBS
  );
}

export async function fetchDepartments(
  ghSlug: string
): Promise<GreenhouseDepartment[]> {
  try {
    const departmentsUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
      ghSlug
    )}/departments/`;

    const departmentsResponse = await fetch(departmentsUrl);
    if (!departmentsResponse.ok) {
      console.error(
        `Greenhouse API error: ${departmentsResponse.status} ${departmentsResponse.statusText}`
      );
      return [];
    }

    const departmentsData = (await departmentsResponse.json()) as {
      departments: any[];
    };
    return departmentsData.departments || [];
  } catch (error) {
    console.error("Error fetching departments from Greenhouse:", error);
    return [];
  }
}

export async function fetchDepartmentsCached(
  ghSlug: string,
  kv: KVNamespace
): Promise<GreenhouseDepartment[]> {
  const cache = new KVCache(kv);
  const cacheKey = CacheKeys.departments(ghSlug);

  return cache.getOrSet(
    cacheKey,
    () => fetchDepartments(ghSlug),
    CacheTTL.DEPARTMENTS
  );
}

export function decodeHtmlEntities(text: string): string {
  // Server-side HTML entity decoding
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&bull;/g, "•")
    .replace(/&middot;/g, "·");
}
