# KV Caching Implementation Guide

This document explains the KV (Key-Value) caching implementation for the Jobs pages to improve performance by reducing API calls to the Greenhouse API.

## Overview

The KV caching system stores frequently accessed job data in Cloudflare's KV storage to:

- Reduce API calls to Greenhouse
- Improve page load times
- Provide better user experience
- Reduce API rate limiting issues

## Architecture

### Components

1. **KVCache Class** (`src/lib/kvCache.ts`)

   - Generic cache utility with TTL support
   - Handles cache operations (get, set, delete, clear)
   - Provides getOrSet pattern for cache-aside

2. **Cached Greenhouse Functions** (`src/lib/greenhouse.ts`)

   - `fetchGreenhouseJobCached()` - Individual job details
   - `fetchAllJobsCached()` - All jobs for a company
   - `fetchDepartmentsCached()` - Department listings
   - `fetchDepartmentJobsCached()` - Jobs by department

3. **Cache Management APIs**

   - `/api/cache/invalidate` - Cache invalidation
   - `/api/cache/warm` - Cache warming

4. **Cache Warmer** (`src/lib/cacheWarmer.ts`)
   - Pre-populates cache with job data
   - Batch processing for efficiency
   - Statistics and monitoring

## Cache Keys Structure

```
departments:{ghSlug}           - Department listings
allJobs:{ghSlug}              - All jobs for company
deptJobs:{ghSlug}:{deptId}    - Jobs by department
job:{ghSlug}:{jobId}          - Individual job details
jobQuestions:{ghSlug}:{jobId} - Job with questions
jobPage:{ghSlug}:{jobId}      - Rendered job page HTML
jobsListPage:{ghSlug}         - Rendered jobs list page
```

## Cache TTL (Time To Live)

- **Departments**: 10 minutes
- **All Jobs**: 10 minutes
- **Department Jobs**: 10 minutes
- **Job Details**: 15 minutes
- **Job Pages**: 30 minutes
- **Jobs List Pages**: 15 minutes

## Usage

### Automatic Caching

The system automatically uses cached data when available:

```typescript
// API endpoints automatically use cached versions
const departments = await fetchDepartmentsCached(ghSlug, kv);
const jobs = await fetchAllJobsCached(ghSlug, kv);
const job = await fetchGreenhouseJobCached(ghSlug, jobId, kv);
```

### Manual Cache Management

#### Cache Warming

Pre-populate cache with data:

```bash
# Warm all cache for webflow
curl -X POST /api/cache/warm \
  -H "Content-Type: application/json" \
  -d '{"ghSlug": "webflow", "includeJobDetails": true, "maxJobs": 50}'

# Warm only departments
curl -X POST /api/cache/warm \
  -H "Content-Type: application/json" \
  -d '{"ghSlug": "webflow", "type": "departments"}'
```

#### Cache Invalidation

Clear specific cache entries:

```bash
# Clear all cache for a company
curl -X POST /api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "ghSlug", "ghSlug": "webflow"}'

# Clear specific job
curl -X POST /api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"type": "job", "ghSlug": "webflow", "jobId": "12345"}'
```

#### Cache Statistics

View cache usage:

```bash
# Get cache stats for webflow
curl /api/cache/warm?ghSlug=webflow

# List all cache keys
curl /api/cache/invalidate?prefix=webflow
```

## Configuration

### Wrangler Configuration

The KV namespace is configured in `wrangler.json`:

```json
{
  "kv_namespaces": [
    {
      "binding": "JOBS_KV",
      "id": "099e7c9342f946e59e09886f3afab295"
    }
  ]
}
```

### Environment Variables

No additional environment variables are required. The KV binding is automatically available in the runtime environment.

## Performance Benefits

### Before Caching

- Every page load makes multiple API calls to Greenhouse
- API rate limits can cause slow responses
- No offline capability

### After Caching

- First request populates cache, subsequent requests use cached data
- 10-15 minute cache TTL balances freshness with performance
- Significant reduction in API calls
- Faster page loads (especially for job listings)

## Monitoring

### Cache Hit/Miss Tracking

Monitor cache effectiveness:

```typescript
// Check cache stats
const stats = await warmer.getCacheStats("webflow");
console.log(`Total keys: ${stats.totalKeys}`);
console.log(`Estimated size: ${stats.estimatedSize} bytes`);
```

### Cache Warming Schedule

Consider setting up scheduled cache warming:

```bash
# Cron job to warm cache every 5 minutes
*/5 * * * * curl -X POST https://your-domain.com/api/cache/warm -d '{"ghSlug": "webflow"}'
```

## Best Practices

### Cache Strategy

1. **Warm cache proactively** - Use the cache warmer before peak traffic
2. **Monitor cache hit rates** - Adjust TTL based on usage patterns
3. **Invalidate selectively** - Only clear relevant cache entries
4. **Handle cache failures gracefully** - Always fall back to direct API calls

### Development

1. **Test with and without cache** - Ensure fallback works correctly
2. **Use appropriate TTL values** - Balance freshness vs performance
3. **Monitor KV usage** - Stay within Cloudflare limits
4. **Cache warming scripts** - Automate cache population

## Troubleshooting

### Common Issues

1. **Cache not working**

   - Check KV namespace binding in wrangler.json
   - Verify KV namespace exists in Cloudflare dashboard
   - Check runtime environment has access to JOBS_KV

2. **Stale data**

   - Reduce TTL values for more frequent updates
   - Implement cache invalidation on data changes
   - Use cache warming to refresh data

3. **Performance issues**
   - Monitor KV read/write operations
   - Optimize cache key structure
   - Consider batch operations for warming

### Debug Commands

```bash
# Check KV namespace
npx wrangler kv namespace list

# View cache contents
npx wrangler kv key list --namespace-id=099e7c9342f946e59e09886f3afab295

# Clear all cache
npx wrangler kv key delete --namespace-id=099e7c9342f946e59e09886f3afab295 --key="webflow:"
```

## Future Enhancements

1. **Cache compression** - Compress large job data
2. **Smart invalidation** - Webhook-based cache updates
3. **Cache analytics** - Detailed hit/miss metrics
4. **Multi-region caching** - Global cache distribution
5. **Cache versioning** - Handle schema changes gracefully

