import type { APIRoute } from "astro";
import { fetchDepartmentsCached } from "../../lib/greenhouse";

export const GET: APIRoute = async ({ request, locals }) => {
  const { searchParams } = new URL(request.url);
  const ghSlug = searchParams.get("ghSlug") || "webflow";

  try {
    // Use cached version if KV is available, otherwise fall back to direct fetch
    let departments;
    if (locals.runtime?.env?.JOBS_KV) {
      departments = await fetchDepartmentsCached(
        ghSlug,
        locals.runtime.env.JOBS_KV
      );
    } else {
      // Fallback to direct API call
      const url = `https://boards-api.greenhouse.io/v1/boards/${ghSlug}/departments/`;
      const res = await fetch(url);
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch departments" }),
          {
            status: res.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          }
        );
      }
      const data = (await res.json()) as { departments?: any[] };
      departments = data.departments || [];
    }

    return new Response(JSON.stringify({ departments }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
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

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
