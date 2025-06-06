FROM --platform=linux/amd64 node:22.1.0-alpine3.19 as deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

FROM --platform=linux/amd64 node:22.1.0-alpine3.19 as builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:22.1.0-alpine3.19 as runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --prod --frozen-lockfile
RUN npm install -g typeorm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs ./src/docs

CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d dist/config/database/data-source.js && node dist/main"]