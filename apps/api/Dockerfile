FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm --filter @gestion-granjas/api build

FROM node:22-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod || pnpm install --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY scripts/docker-entrypoint-api-prod.sh /app/scripts/docker-entrypoint-api-prod.sh
COPY scripts/docker-entrypoint-api-testing.sh /app/scripts/docker-entrypoint-api-testing.sh

RUN chmod +x /app/scripts/docker-entrypoint-api-prod.sh \
    /app/scripts/docker-entrypoint-api-testing.sh \
  && sed -i 's/\r$//' /app/scripts/docker-entrypoint-api-prod.sh \
    /app/scripts/docker-entrypoint-api-testing.sh

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["/app/scripts/docker-entrypoint-api-testing.sh"]
