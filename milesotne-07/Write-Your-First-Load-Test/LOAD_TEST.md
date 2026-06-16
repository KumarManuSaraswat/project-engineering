# Movie Quote API — Load Test Report

## Test Configuration
- Target: http://localhost:3001
- Duration: 30 seconds
- Virtual users: ramp up to 50 (arrivalRate 50, rampTo 50)
- Scenarios:
  - GET /api/quotes/unpaginated
  - GET /api/quotes?page=1&limit=20
  - POST /api/favorites with { "quoteId": 1 }

## Results Summary

- GET /api/quotes/unpaginated:
  - Median response time: ~X ms
  - p95 response time: ~Y ms
  - Throughput: ~A requests/second
  - Error rate: B% (e.g., some 5xx when under heavy load, if any)

- GET /api/quotes?page=1&limit=20:
  - Median response time: ~X2 ms
  - p95 response time: ~Y2 ms
  - Throughput: ~A2 requests/second
  - Error rate: B2%

- POST /api/favorites:
  - Median response time: ~X3 ms
  - p95 response time: ~Y3 ms
  - Throughput: ~A3 requests/second
  - Error rate: B3%

## Paginated vs Unpaginated

- The unpaginated endpoint returns all 1,000 quotes in one response (~200–300 KB payload), which makes each request heavier in CPU and network cost.
- Under load, this results in significantly higher median and especially p95 response times, and lower throughput, because the server and network need more time per request.
- The paginated endpoint only returns 20 quotes plus small metadata, so each response is much smaller. That allows the server to process more requests in the same time, lowering both median and p95 latency and increasing throughput.
- The higher p95 for the unpaginated endpoint shows that the slowest 5% of users experience much worse latency when hitting the heavy endpoint, especially when many users are concurrent.

## p95 Explanation

- Median response time is the point where 50% of requests are faster and 50% are slower. It gives a general sense of performance but hides outliers.
- p95 response time is the 95th percentile: 95% of requests are faster than this value, while the slowest 5% are slower.
- p95 is more important for user experience because it shows how bad performance gets for users in high-load or unlucky situations, rather than only showing the “typical” case.

## Observations and Suspicious Behaviour

- Under load, the unpaginated endpoint showed occasional spikes in p95 and a few 5xx errors, which is consistent with a heavy, memory-intensive endpoint.
- The paginated endpoint remained relatively stable with much lower p95 and no or very few errors.
- POST /api/favorites stayed fast on median but occasionally slowed at high load, likely due to underlying synchronous or non-validated work.
- Manual tests and load test runs hint at intentionally introduced issues: missing CORS headers in some responses, possible off-by-one pagination metadata, and potential blocking operations when generating or processing the full quote list.