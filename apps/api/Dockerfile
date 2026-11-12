FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages ./packages
# Node 20 ships npm 10.8.2, which crashes on this lock (edgesOut) and
# rejects it as out of sync. npm 11.6.2 installs the same lockfile.
RUN npm install -g npm@11.6.2 && npm ci --omit=dev

COPY migrations ./migrations
COPY scripts ./scripts
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4002
ENV PORT=4002

CMD ["node", "src/apiServer.js"]
