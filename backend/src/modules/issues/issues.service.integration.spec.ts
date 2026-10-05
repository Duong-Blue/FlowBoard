import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { IssuesService } from './issues.service';
import { AppModule } from '../../app.module';
import { ActivityModule } from '../activity/activity.module';

describe('IssuesService (Integration)', () => {
  let service: IssuesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ActivityModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $disconnect: vi.fn(),
        comment: { deleteMany: vi.fn() },
        notification: { deleteMany: vi.fn() },
        issueRelation: { deleteMany: vi.fn() },
        attachment: { deleteMany: vi.fn() },
        savedView: { deleteMany: vi.fn() },
        issue: { deleteMany: vi.fn() },
        workflowTransition: { deleteMany: vi.fn() },
        workflowStatus: { deleteMany: vi.fn() },
        workflow: { deleteMany: vi.fn() },
        projectMember: { deleteMany: vi.fn() },
        project: { deleteMany: vi.fn() },
        invitation: { deleteMany: vi.fn() },
        organizationMember: { deleteMany: vi.fn() },
        organization: { deleteMany: vi.fn() },
        user: { deleteMany: vi.fn() },
      })
      .compile();

    service = module.get<IssuesService>(IssuesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up
    try {
      await prisma.comment.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.issueRelation.deleteMany({});
      await prisma.attachment.deleteMany({});
      await prisma.savedView.deleteMany({});
      await prisma.issue.deleteMany({});
      await prisma.workflowTransition.deleteMany({});
      await prisma.workflowStatus.deleteMany({});
      await prisma.workflow.deleteMany({});
      await prisma.projectMember.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.invitation.deleteMany({});
      await prisma.organizationMember.deleteMany({});
      await prisma.organization.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (err: any) {
      console.error('CLEANUP ERROR:', err.code, err.message);
      throw err;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
