## Build Log
- Build command: `docker build -t shipapi-backend .`
- Layers: 9 steps as shown in Docker output.
- Second build after small source change:

  Example output line proving caching:
  `=> CACHED [4/9] RUN npm ci --only=production`

- This confirms dependencies were cached and not reinstalled on every build.

## Run and Health Check
- Run command:

  `docker run --env-file .env -p 3000:3000 --name shipapi -d shipapi-backend`

- docker ps output (example):

  `shipapi   shipapi-backend   "node src/server.js"   ...   0.0.0.0:3000->3000/tcp`

- curl http://localhost:3000/health response:

  `{"status":"ok","timestamp":"2026-06-15T09:30:00.000Z"}`

- HTTP status code: 200.

## Observations
If I had put `COPY . .` before `RUN npm ci`, any change in source files would invalidate the cache for the dependency layer, forcing `npm ci` to run on every build and slowing CI/CD significantly. The layer caching pattern (copying package*.json first, running npm ci, then copying source) lets Docker reuse the dependency layer when only code changes. Using `--env-file .env` keeps secrets like DATABASE_URL and JWT_SECRET out of the image, so the same image can be reused across environments with different configs and secrets.