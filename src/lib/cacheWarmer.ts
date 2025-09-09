// Cache warming utility to pre-populate KV cache with job data
import {
  fetchDepartmentsCached,
  fetchAllJobsCached,
  fetchGreenhouseJobCached,
} from "./greenhouse";
import { KVCache, CacheKeys, CacheTTL } from "./kvCache";

export interface CacheWarmOptions {
  ghSlug: string;
  kv: KVNamespace;
  includeJobDetails?: boolean;
  maxJobs?: number;
}

export class CacheWarmer {
  private kv: KVNamespace;
  private cache: KVCache;

  constructor(kv: KVNamespace) {
    this.kv = kv;
    this.cache = new KVCache(kv);
  }

  /**
   * Warm the cache with departments data
   */
  async warmDepartments(ghSlug: string): Promise<void> {
    console.log(`Warming departments cache for ${ghSlug}...`);
    try {
      await fetchDepartmentsCached(ghSlug, this.kv);
      console.log(`✅ Departments cache warmed for ${ghSlug}`);
    } catch (error) {
      console.error(
        `❌ Failed to warm departments cache for ${ghSlug}:`,
        error
      );
    }
  }

  /**
   * Warm the cache with all jobs data
   */
  async warmAllJobs(ghSlug: string): Promise<void> {
    console.log(`Warming all jobs cache for ${ghSlug}...`);
    try {
      await fetchAllJobsCached(ghSlug, this.kv);
      console.log(`✅ All jobs cache warmed for ${ghSlug}`);
    } catch (error) {
      console.error(`❌ Failed to warm all jobs cache for ${ghSlug}:`, error);
    }
  }

  /**
   * Warm the cache with individual job details
   */
  async warmJobDetails(
    ghSlug: string,
    jobIds: string[],
    maxConcurrent: number = 5
  ): Promise<void> {
    console.log(`Warming job details cache for ${jobIds.length} jobs...`);

    // Process jobs in batches to avoid overwhelming the API
    for (let i = 0; i < jobIds.length; i += maxConcurrent) {
      const batch = jobIds.slice(i, i + maxConcurrent);
      const promises = batch.map((jobId) =>
        fetchGreenhouseJobCached(ghSlug, jobId, this.kv)
          .then(() => console.log(`✅ Job ${jobId} cached`))
          .catch((error) =>
            console.error(`❌ Failed to cache job ${jobId}:`, error)
          )
      );

      await Promise.all(promises);

      // Small delay between batches to be respectful to the API
      if (i + maxConcurrent < jobIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Job details cache warming completed`);
  }

  /**
   * Comprehensive cache warming
   */
  async warmAll(options: CacheWarmOptions): Promise<void> {
    const { ghSlug, includeJobDetails = false, maxJobs = 50 } = options;

    console.log(`🚀 Starting comprehensive cache warming for ${ghSlug}...`);

    try {
      // 1. Warm departments
      await this.warmDepartments(ghSlug);

      // 2. Warm all jobs
      await this.warmAllJobs(ghSlug);

      // 3. Optionally warm individual job details
      if (includeJobDetails) {
        const allJobs = await fetchAllJobsCached(ghSlug, this.kv);
        const jobIds = allJobs
          .slice(0, maxJobs)
          .map((job) => job.id.toString());

        if (jobIds.length > 0) {
          await this.warmJobDetails(ghSlug, jobIds);
        }
      }

      console.log(`🎉 Cache warming completed for ${ghSlug}`);
    } catch (error) {
      console.error(`❌ Cache warming failed for ${ghSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(ghSlug?: string): Promise<{
    totalKeys: number;
    keysByPrefix: Record<string, number>;
    estimatedSize: number;
  }> {
    const prefix = ghSlug ? `${ghSlug}:` : "";
    const keys = await this.kv.list({ prefix });

    const keysByPrefix: Record<string, number> = {};
    let estimatedSize = 0;

    for (const key of keys.keys) {
      const keyPrefix = key.name.split(":")[0];
      keysByPrefix[keyPrefix] = (keysByPrefix[keyPrefix] || 0) + 1;
      estimatedSize += key.name.length + (key.metadata?.size || 0);
    }

    return {
      totalKeys: keys.keys.length,
      keysByPrefix,
      estimatedSize,
    };
  }

  /**
   * Clear cache for a specific ghSlug
   */
  async clearCache(ghSlug: string): Promise<void> {
    console.log(`Clearing cache for ${ghSlug}...`);
    await this.cache.clearPrefix(`${ghSlug}:`);
    console.log(`✅ Cache cleared for ${ghSlug}`);
  }
}

