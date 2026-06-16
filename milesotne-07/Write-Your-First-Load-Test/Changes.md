# Manual Investigation Notes

- GET /api/quotes/unpaginated:
  - Time: ~0.35s
  - Size: ~240 KB
  - Observed: noticeable delay compared to paginated endpoint.

- GET /api/quotes?page=1&limit=20:
  - Time: ~0.04s
  - Size: ~6 KB
  - Observed: much faster; pagination metadata present.

- POST /api/favorites:
  - Time: ~0.05s
  - Observed: occasional delay / any errors (if you see them).

- Suspicious behaviour:
  - e.g., any CORS errors in browser, odd pagination totals, or blocking behavior.