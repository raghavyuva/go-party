FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 1001 goparty && \
    adduser -u 1001 -G goparty -s /bin/sh -D goparty && \
    chown -R goparty:goparty /app

COPY --from=builder --chown=goparty:goparty /app/next.config.mjs ./
COPY --from=builder --chown=goparty:goparty /app/.next ./.next
COPY --from=builder --chown=goparty:goparty /app/node_modules ./node_modules
COPY --from=builder --chown=goparty:goparty /app/package.json ./
# COPY --from=builder --chown=goparty:goparty /app/yarn.lock ./

RUN mkdir -p .next/cache && \
    chown -R goparty:goparty . && \
    chmod -R 755 .

USER goparty

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]