import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema/',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/flowboard_dev',
    shadowDatabaseUrl: 'postgresql://postgres:password@localhost:5432/flowboard_shadow',
  },
});
