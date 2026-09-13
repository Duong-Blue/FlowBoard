import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema/',
  earlyAccess: true,
  datasourceUrl: process.env.DATABASE_URL,
});
