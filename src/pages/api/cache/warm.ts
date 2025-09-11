import type { APIRoute } from "astro";
import { CacheWarmer } from "../../../lib/cacheWarmer";
import type { WarmCacheRequestBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if KV is available
    if (!locals.runtime?.env?.JOBS_KV) {
      return new Response(JSON.stringify({ error: "KV not available" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const body = (await request.json()) as WarmCacheRequestBody;
    const {
      ghSlug = "webflow",
      includeJobDetails = false,
      maxJobs = 50,
      type = "all", // "all", "departments", "jobs", "jobDetails"
    } = body;

    const warmer = new CacheWarmer(locals.runtime.env.JOBS_KV);

    let result: any = {};

    switch (type) {
      case "departments":
        await warmer.warmDepartments(ghSlug);
        result = { message: "Departments cache warmed", ghSlug };
        break;

      case "jobs":
        await warmer.warmAllJobs(ghSlug);
        result = { message: "All jobs cache warmed", ghSlug };
        break;

      case "jobDetails":
        if (includeJobDetails) {
          const { fetchAllJobsCached } = await import(
            "../../../lib/greenhouse"
          );
          const allJobs = await fetchAllJobsCached(
            ghSlug,
            locals.runtime.env.JOBS_KV
          );
          const jobIds = allJobs
            .slice(0, maxJobs)
            .map((job) => job.id.toString());

          if (jobIds.length > 0) {
            await warmer.warmJobDetails(ghSlug, jobIds);
            result = {
              message: "Job details cache warmed",
              ghSlug,
              jobsWarmed: jobIds.length,
            };
          } else {
            result = { message: "No jobs to warm", ghSlug };
          }
        } else {
          result = { message: "Job details warming skipped", ghSlug };
        }
        break;

      case "all":
      default:
        await warmer.warmAll({
          ghSlug,
          includeJobDetails,
          maxJobs,
          kv: locals.runtime.env.JOBS_KV,
        });
        result = {
          message: "Complete cache warming completed",
          ghSlug,
          includeJobDetails,
          maxJobs,
        };
        break;
    }

    // Get cache stats after warming
    const stats = await warmer.getCacheStats(ghSlug);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        cacheStats: stats,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error warming cache:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check if KV is available
    if (!locals.runtime?.env?.JOBS_KV) {
      return new Response(JSON.stringify({ error: "KV not available" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const ghSlug = searchParams.get("ghSlug") || "webflow";

    const warmer = new CacheWarmer(locals.runtime.env.JOBS_KV);
    const stats = await warmer.getCacheStats(ghSlug);

    return new Response(
      JSON.stringify({
        cacheStats: stats,
        ghSlug,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
