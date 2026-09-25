import 'dotenv/config';
import { PrismaClient, IssueStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const projects = await prisma.project.findMany({ include: { workflow: true } });

  for (const project of projects) {
    let workflow = project.workflow;
    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: { projectId: project.id },
      });
      console.log(`Created Workflow for project: ${project.id}`);
    }

    const statuses = await prisma.workflowStatus.findMany({ where: { workflowId: workflow.id } });
    if (statuses.length === 0) {
      const todo = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: 'To Do', category: IssueStatus.TODO, order: 0, color: '#6B7280' },
      });
      const inProgress = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: 'In Progress', category: IssueStatus.IN_PROGRESS, order: 1, color: '#3B82F6' },
      });
      const inPreview = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: 'In Preview', category: IssueStatus.IN_PREVIEW, order: 2, color: '#8B5CF6' },
      });
      const done = await prisma.workflowStatus.create({
        data: { workflowId: workflow.id, name: 'Done', category: IssueStatus.DONE, order: 3, color: '#10B981' },
      });

      console.log(`Created statuses for workflow: ${workflow.id}`);

      // Transitions
      await prisma.workflowTransition.createMany({
        data: [
          { workflowId: workflow.id, toStatusId: todo.id },
          { workflowId: workflow.id, fromStatusId: todo.id, toStatusId: inProgress.id },
          { workflowId: workflow.id, fromStatusId: inProgress.id, toStatusId: inPreview.id },
          { workflowId: workflow.id, fromStatusId: inPreview.id, toStatusId: done.id },
          { workflowId: workflow.id, fromStatusId: done.id, toStatusId: inProgress.id },
        ],
      });
    }

    // Map existing issues
    const updatedStatuses = await prisma.workflowStatus.findMany({ where: { workflowId: workflow.id } });
    const statusMap = new Map(updatedStatuses.map(s => [s.category, s.id]));

    const issues = await prisma.issue.findMany({ where: { projectId: project.id, workflowStatusId: null } });
    for (const issue of issues) {
      const workflowStatusId = statusMap.get(issue.status);
      if (workflowStatusId) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { workflowStatusId },
        });
      }
    }
    console.log(`Backfilled issues for project: ${project.id}`);
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
