import type { APIRoute } from "astro";
import { fetchAllJobs, fetchAllJobsCached } from "../../lib/greenhouse";

export const GET: APIRoute = async ({ request, locals }) => {
  const { searchParams } = new URL(request.url);
  const ghSlug = searchParams.get("ghSlug") || "webflow";

  try {
    // Use cached version if KV is available, otherwise fall back to direct fetch
    let allJobs;
    if (locals.runtime?.env?.JOBS_KV) {
      allJobs = await fetchAllJobsCached(ghSlug, locals.runtime.env.JOBS_KV);
    } else {
      allJobs = await fetchAllJobs(ghSlug);
    }

    return new Response(
      JSON.stringify({
        jobs: allJobs,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
