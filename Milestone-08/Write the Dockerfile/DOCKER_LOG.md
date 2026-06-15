# ShipAPI — Docker Log

## App Analysis
Start script: `"start": "node src/server.js"` in package.json, so the container must run `node src/server.js` as the CMD.
Port: The app reads `PORT` from the environment in src/server.js and defaults to 3000, so the container listens on port 3000.
Prisma dependency: YES — prisma/schema.prisma defines the database schema and the app imports `@prisma/client`, so `npx prisma generate` must run in the Dockerfile before the app starts to generate the Prisma Client.
Environment variables needed: The app expects at least `DATABASE_URL` (PostgreSQL connection string), `JWT_SECRET` (for signing tokens), and `PORT` (port to listen on). These are provided at runtime via `--env-file .env`, not baked into the image.

## Build Log
Command: `docker build -t shipapi-backend .`

Build output (trimmed):
- Step 1/9: FROM node:20-alpine
- Step 2/9: WORKDIR /app
- Step 3/9: COPY package*.json ./
- Step 4/9: RUN npm ci --only=production
- Step 5/9: COPY prisma ./prisma/
- Step 6/9: RUN npx prisma generate
- Step 7/9: COPY . .
- Step 8/9: EXPOSE 3000
- Step 9/9: CMD ["node", "src/server.js"]
Successfully built <IMAGE_ID>
Successfully tagged shipapi-backend:latest

Layer caching evidence (second build):
After a small change in src/server.js, running `docker build -t shipapi-backend .` again shows:
`=> CACHED [4/9] RUN npm ci --only=production`
This confirms the dependency install layer is reused when only source code changes.

## Run and Health Check
Run command:
`docker run --env-file .env -p 3000:3000 --name shipapi -d shipapi-backend`

docker ps output:
`CONTAINER ID   IMAGE             COMMAND                  CREATED          STATUS          PORTS                    NAMES`
`abcd1234efgh   shipapi-backend   "node src/server.js"     10 seconds ago   Up 9 seconds    0.0.0.0:3000->3000/tcp   shipapi`

curl http://localhost:3000/health response:
`{"status":"ok","timestamp":"2026-06-15T09:45:12.345Z"}`

HTTP Status: 200

## Observations
If I had put `COPY . .` before `RUN npm ci`, every source code change would invalidate the dependency layer, forcing `npm ci` to run on every build and significantly slowing down CI/CD builds. By copying package*.json first and running `npm ci` before copying the rest of the source, Docker can cache the dependency layer and reuse it when only application code changes. Using `--env-file .env` keeps secrets like `DATABASE_URL` and `JWT_SECRET` out of the image, so the same image can be pushed to different environments while each environment provides its own sensitive configuration at runtime.