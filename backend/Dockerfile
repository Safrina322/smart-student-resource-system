FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# npm install rather than npm ci: this is a dev-only image (CI uses npm ci
# for strict reproducibility) and the lockfile's large optional-dependency
# matrix (vitest -> Vite -> rolldown's per-platform native bindings) can hit
# npm ci's strict-sync check depending on the exact npm/platform combination
# that last regenerated it.
RUN npm install

COPY . .

EXPOSE 5000

# nodemon -L (legacy/polling watch) rather than plain `node --watch`: on
# Docker Desktop for Windows, bind-mounted file changes don't reliably
# propagate as inotify events into the Linux container, so an
# event-based watcher never fires. Polling works regardless of host OS.
# This image is for local dev parity (docker-compose bind-mounts the
# source over what COPY put here), not a production build.
CMD ["node_modules/.bin/nodemon", "-L", "index.js"]
