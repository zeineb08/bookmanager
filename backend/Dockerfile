FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
