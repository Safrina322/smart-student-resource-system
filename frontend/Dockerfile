FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# npm install rather than npm ci - see backend/Dockerfile for why (same
# Vite/rolldown optional-dependency-matrix lockfile sensitivity).
RUN npm install

COPY . .

EXPOSE 5173

# --host so the Vite dev server accepts connections from outside the
# container (the host browser), not just localhost within it.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
