# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_DIR=/data/uploads

RUN mkdir -p /data/uploads && chown -R node:node /data
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node cluster-entry.mjs ./cluster-entry.mjs

USER node
EXPOSE 3000
VOLUME ["/data/uploads"]

CMD ["node", "cluster-entry.mjs"]
