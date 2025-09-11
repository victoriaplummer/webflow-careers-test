// KV Cache utility for jobs data
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class KVCache {
  private kv: KVNamespace;
  private defaultTTL: number;

  constructor(kv: KVNamespace, defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.kv = kv;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.kv.get(key, "json");
      if (!cached) return null;

      const entry = cached as CacheEntry<T>;
      const now = Date.now();

      // Check if cache entry has expired
      if (now - entry.timestamp > entry.ttl) {
        await this.kv.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error("Error getting from KV cache:", error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };

      await this.kv.put(key, JSON.stringify(entry));
    } catch (error) {
      console.error("Error setting KV cache:", error);
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error("Error deleting from KV cache:", error);
    }
  }

  /**
   * Clear all cache entries with a specific prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.kv.list({ prefix });
      const deletePromises = keys.keys.map((key) => this.kv.delete(key.name));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing cache prefix:", error);
    }
  }

  /**
   * Get or set pattern - get from cache or fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const freshData = await fetchFn();

    // Cache the fresh data
    await this.set(key, freshData, ttl);

    return freshData;
  }
}

// Cache key generators
export const CacheKeys = {
  // Department and jobs data
  departments: (ghSlug: string) => `departments:${ghSlug}`,
  allJobs: (ghSlug: string) => `allJobs:${ghSlug}`,
  departmentJobs: (ghSlug: string, departmentId: number) =>
    `deptJobs:${ghSlug}:${departmentId}`,

  // Individual job data
  job: (ghSlug: string, jobId: string) => `job:${ghSlug}:${jobId}`,
  jobWithQuestions: (ghSlug: string, jobId: string) =>
    `jobQuestions:${ghSlug}:${jobId}`,

  // Job page HTML (for static generation)
  jobPage: (ghSlug: string, jobId: string) => `jobPage:${ghSlug}:${jobId}`,
  jobsListPage: (ghSlug: string) => `jobsListPage:${ghSlug}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  DEPARTMENTS: 10 * 60 * 1000, // 10 minutes
  ALL_JOBS: 10 * 60 * 1000, // 10 minutes
  DEPARTMENT_JOBS: 10 * 60 * 1000, // 10 minutes
  JOB_DETAILS: 15 * 60 * 1000, // 15 minutes
  JOB_PAGE: 30 * 60 * 1000, // 30 minutes
  JOBS_LIST_PAGE: 15 * 60 * 1000, // 15 minutes
} as const;
