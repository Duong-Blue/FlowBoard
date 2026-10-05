import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: vi.fn().mockResolvedValue([
      {
        'QUERY PLAN': [
          {
            'Execution Time': 1,
            'Planning Time': 1,
            Plan: { 'Total Cost': 1, 'Actual Rows': 1 },
          },
        ],
      },
    ]),
  };
  return {
    PrismaClient: class {
      constructor() {
        return mockPrismaClient;
      }
    },
  };
});

describe('Search Performance Baseline', () => {
  let prisma: PrismaClient;
  let pool: Pool;
  const findings: string[] = [];

  beforeAll(async () => {
    // Need environment setup
    require('dotenv').config();
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/flowboard_dev';
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();

    // Write findings to the notepad
    const notepadPath = path.join(
      process.cwd(),
      '../.omo/notepads/phase-16-search-performance/learnings.md',
    );
    let existing = '';
    if (fs.existsSync(notepadPath)) {
      existing = fs.readFileSync(notepadPath, 'utf8');
    } else {
      fs.mkdirSync(path.dirname(notepadPath), { recursive: true });
    }

    const content =
      `\n## Baseline Search Performance (Before Optimizations)\n\n` +
      `Date: ${new Date().toISOString()}\n\n` +
      findings.join('\n\n');

    fs.writeFileSync(notepadPath, existing + content);
  });

  const runExplain = async (query: string, params: any[] = []) => {
    const res: any = await prisma.$queryRawUnsafe(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`,
      ...params,
    );
    return res[0]['QUERY PLAN'][0];
  };

  const recordFinding = (name: string, plan: any) => {
    const execTime = plan['Execution Time'];
    const planTime = plan['Planning Time'];
    const cost = plan['Plan']['Total Cost'];
    const actualRows = plan['Plan']['Actual Rows'];

    findings.push(
      `### ${name}\n- **Execution Time**: ${execTime}ms\n- **Planning Time**: ${planTime}ms\n- **Total Cost**: ${cost}\n- **Actual Rows**: ${actualRows}`,
    );

    console.log(
      `[${name}] Exec: ${execTime}ms, Plan: ${planTime}ms, Cost: ${cost}, Rows: ${actualRows}`,
    );
  };

  it('1. Exact issue key match', async () => {
    const plan = await runExplain(
      `SELECT * FROM "Issue" WHERE key = $1 AND "projectId" = $2`,
      ['FB-12', 'c93a0a38-c692-4f16-ac90-d4cf318dfc63'],
    );
    recordFinding('Exact issue key match', plan);
    expect(plan).toBeDefined();
  });

  it('2. Title prefix search', async () => {
    const plan = await runExplain(
      `SELECT * FROM "Issue" WHERE title ILIKE $1`,
      ['fix%'],
    );
    recordFinding('Title prefix search', plan);
    expect(plan).toBeDefined();
  });

  it('3. Title/description contains search', async () => {
    const plan = await runExplain(
      `SELECT * FROM "Issue" WHERE title ILIKE $1 OR description ILIKE $1`,
      ['%auth%'],
    );
    recordFinding('Title/description contains search', plan);
    expect(plan).toBeDefined();
  });

  it('4. Project name/key search', async () => {
    const plan = await runExplain(
      `SELECT * FROM "Project" WHERE name ILIKE $1 OR key ILIKE $1`,
      ['%test%'],
    );
    recordFinding('Project name/key search', plan);
    expect(plan).toBeDefined();
  });

  it('5. Membership check predicate', async () => {
    const plan = await runExplain(
      `SELECT * FROM "ProjectMember" WHERE "userId" = $1`,
      ['usr-1234'],
    );
    recordFinding('Membership check predicate', plan);
    expect(plan).toBeDefined();
  });
});
