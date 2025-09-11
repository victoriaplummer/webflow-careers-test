import type { APIRoute } from "astro";
import { CacheWarmer } from "../../../lib/cacheWarmer";

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
        ghSlug,
        stats,
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
    console.error("Cache status error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get cache status",
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
