import 'dotenv/config';
import { PrismaClient, IssueStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting backfill script...");
  const projects = await prisma.project.findMany({ include: { workflow: true } });
  console.log(`Found ${projects.length} projects`);

  for (const project of projects) {
    let workflow = project.workflow;
    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: { projectId: project.id },
      });
      console.log(`Created Workflow for project: ${project.id}`);
    }

    const statuses = await prisma.workflowStatus.findMany({ where: { workflowId: workflow.id } });
    const statusCategoryMap = new Map(statuses.map(s => [s.category, s.id]));

    const defaultStatuses = [
      { name: 'To Do', category: IssueStatus.TODO, order: 0, color: '#6B7280' },
      { name: 'In Progress', category: IssueStatus.IN_PROGRESS, order: 1, color: '#3B82F6' },
      { name: 'In Preview', category: IssueStatus.IN_PREVIEW, order: 2, color: '#8B5CF6' },
      { name: 'Done', category: IssueStatus.DONE, order: 3, color: '#10B981' },
    ];

    let statusesAdded = 0;
    for (const ds of defaultStatuses) {
      if (!statusCategoryMap.has(ds.category)) {
        const created = await prisma.workflowStatus.create({
          data: { ...ds, workflowId: workflow.id },
        });
        statusCategoryMap.set(ds.category, created.id);
        statusesAdded++;
      }
    }
    if (statusesAdded > 0) console.log(`Created ${statusesAdded} missing statuses for workflow: ${workflow.id}`);

    const transitions = await prisma.workflowTransition.findMany({ where: { workflowId: workflow.id } });
    const transitionSet = new Set(transitions.map(t => `${t.fromStatusId || 'null'}-${t.toStatusId}`));

    const defaultTransitions = [
      { from: null, to: IssueStatus.TODO },
      { from: IssueStatus.TODO, to: IssueStatus.IN_PROGRESS },
      { from: IssueStatus.IN_PROGRESS, to: IssueStatus.IN_PREVIEW },
      { from: IssueStatus.IN_PREVIEW, to: IssueStatus.DONE },
      { from: IssueStatus.DONE, to: IssueStatus.IN_PROGRESS },
    ];

    const newTransitions = [];
    for (const dt of defaultTransitions) {
      const fromId = dt.from ? statusCategoryMap.get(dt.from) : null;
      const toId = statusCategoryMap.get(dt.to);
      if (!toId) continue;

      const key = `${fromId || 'null'}-${toId}`;
      if (!transitionSet.has(key)) {
        newTransitions.push({ workflowId: workflow.id, fromStatusId: fromId, toStatusId: toId });
        transitionSet.add(key);
      }
    }

    if (newTransitions.length > 0) {
      await prisma.workflowTransition.createMany({ data: newTransitions });
      console.log(`Created ${newTransitions.length} missing transitions for workflow: ${workflow.id}`);
    }

    // Map existing issues
    const issues = await prisma.issue.findMany({ where: { projectId: project.id, workflowStatusId: null } });
    let mappedCount = 0;
    for (const issue of issues) {
      const workflowStatusId = statusCategoryMap.get(issue.status);
      if (workflowStatusId) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { workflowStatusId },
        });
        mappedCount++;
      }
    }
    if (mappedCount > 0) console.log(`Backfilled ${mappedCount} issues for project: ${project.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
