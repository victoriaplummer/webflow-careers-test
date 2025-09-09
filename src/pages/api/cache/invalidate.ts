import type { APIRoute } from "astro";
import { KVCache, CacheKeys } from "../../../lib/kvCache";

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

    const body = await request.json();
    const { type, ghSlug, jobId, departmentId } = body;

    const cache = new KVCache(locals.runtime.env.JOBS_KV);

    switch (type) {
      case "all":
        // Clear all cache entries
        await cache.clearPrefix("");
        break;

      case "departments":
        if (ghSlug) {
          await cache.delete(CacheKeys.departments(ghSlug));
        }
        break;

      case "allJobs":
        if (ghSlug) {
          await cache.delete(CacheKeys.allJobs(ghSlug));
        }
        break;

      case "departmentJobs":
        if (ghSlug && departmentId) {
          await cache.delete(CacheKeys.departmentJobs(ghSlug, departmentId));
        }
        break;

      case "job":
        if (ghSlug && jobId) {
          await cache.delete(CacheKeys.job(ghSlug, jobId));
          await cache.delete(CacheKeys.jobWithQuestions(ghSlug, jobId));
          await cache.delete(CacheKeys.jobPage(ghSlug, jobId));
        }
        break;

      case "jobPage":
        if (ghSlug && jobId) {
          await cache.delete(CacheKeys.jobPage(ghSlug, jobId));
        }
        break;

      case "jobsListPage":
        if (ghSlug) {
          await cache.delete(CacheKeys.jobsListPage(ghSlug));
        }
        break;

      case "ghSlug":
        if (ghSlug) {
          // Clear all cache entries for a specific ghSlug
          await cache.clearPrefix(`${ghSlug}:`);
        }
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid cache type" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cache invalidated for type: ${type}`,
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
    console.error("Error invalidating cache:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
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
    const prefix = searchParams.get("prefix") || "";

    const cache = new KVCache(locals.runtime.env.JOBS_KV);
    const keys = await locals.runtime.env.JOBS_KV.list({ prefix });

    return new Response(
      JSON.stringify({
        keys: keys.keys.map((k) => k.name),
        count: keys.keys.length,
        prefix,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error listing cache keys:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
