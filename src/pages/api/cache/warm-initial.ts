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
      type = "all",
    } = body;

    const warmer = new CacheWarmer(locals.runtime.env.JOBS_KV);

    // Warm essential cache data for immediate page loads
    await Promise.all([
      warmer.warmDepartments(ghSlug),
      warmer.warmAllJobs(ghSlug),
    ]);

    return new Response(
      JSON.stringify({
        message: "Initial cache warming completed",
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
    console.error("Cache warming error:", error);
    return new Response(
      JSON.stringify({
        error: "Cache warming failed",
        message: error instanceof Error ? error.message : "Unknown error",
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
