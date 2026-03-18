FROM node:20-slim AS builder

WORKDIR /app

# Install openssl and other dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates python3 make g++

COPY package*.json ./
RUN npm install
COPY prisma ./prisma/

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-slim

WORKDIR /app

# Install openssl for production
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
