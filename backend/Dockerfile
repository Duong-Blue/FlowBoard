# Single stage production Dockerfile
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
