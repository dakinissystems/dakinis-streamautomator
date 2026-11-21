FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Registry auth: Railway/build must set NODE_AUTH_TOKEN (PAT read:packages).
# .npmrc references ${NODE_AUTH_TOKEN}; do not commit a real token.
# npm 11.6.2 avoids arborist edgesOut crash on this dependency tree.
COPY package.json .npmrc ./
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN
RUN npm install -g npm@11.6.2 \
  && npm install --omit=dev --no-audit --no-fund \
  && npm cache clean --force \
  && rm -f .npmrc

COPY migrations ./migrations
COPY scripts ./scripts
COPY src ./src

ENV NODE_ENV=production
ENV NODE_AUTH_TOKEN=
EXPOSE 4002
ENV PORT=4002

CMD ["node", "src/apiServer.js"]
