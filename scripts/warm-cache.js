#!/usr/bin/env node

/**
 * Cache warming script for development
 * This script pre-populates the KV cache to prevent FOUC during development
 */

const BASE_URL =
  process.env.DEV_URL || "http://localhost:4321/careers-portal-kv";

async function warmCache() {
  console.log("🔥 Warming cache...");

  try {
    const response = await fetch(`${BASE_URL}/api/cache/warm-initial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ghSlug: "webflow",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Cache warmed successfully:", result);
  } catch (error) {
    console.error("❌ Cache warming failed:", error.message);
    process.exit(1);
  }
}

async function checkCacheStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/cache/status?ghSlug=webflow`);

    if (response.ok) {
      const status = await response.json();
      console.log("📊 Cache status:", status);
    }
  } catch (error) {
    console.log("⚠️  Could not check cache status:", error.message);
  }
}

// Run cache warming
warmCache().then(() => {
  // Check status after warming
  setTimeout(checkCacheStatus, 1000);
});
