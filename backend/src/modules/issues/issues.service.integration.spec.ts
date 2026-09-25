import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { IssuesService } from './issues.service';
import { DatabaseModule } from '../../database/database.module';
import { AppModule } from '../../app.module';
import { ProjectRole, IssueStatus } from '@prisma/client';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { generateKeyBetween } from 'fractional-indexing';

describe('IssuesService (Integration)', () => {
  let service: IssuesService;
  let prisma: PrismaService;
  let orgId: string;
  let projectId: string;
  let adminId: string;
  let memberId: string;
  let viewerId: string;
  let otherProjectId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
      await prisma.issueActivity.deleteMany({});
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
      await prisma.organizationMember.deleteMany({});
      await prisma.organization.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (err: any) {
      console.error('CLEANUP ERROR:', err.code, err.message);
      throw err;
    }

    // Setup users
    const ts = Date.now();
    const [admin, member, viewer] = await Promise.all([
      prisma.user.create({
        data: {
          email: `admin-${ts}@test.com`,
          passwordHash: 'hash',
          firstName: 'A',
          lastName: 'A',
        },
      }),
      prisma.user.create({
        data: {
          email: `member-${ts}@test.com`,
          passwordHash: 'hash',
          firstName: 'M',
          lastName: 'M',
        },
      }),
      prisma.user.create({
        data: {
          email: `viewer-${ts}@test.com`,
          passwordHash: 'hash',
          firstName: 'V',
          lastName: 'V',
        },
      }),
    ]);
    adminId = admin.id;
    memberId = member.id;
    viewerId = viewer.id;

    // Setup Org & Project
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: `test-org-${ts}` },
    });
    orgId = org.id;

    const project = await prisma.project.create({
      data: { name: 'Test Proj', organizationId: orgId, key: 'TEST' },
    });
    projectId = project.id;
    await service.getOrCreateDefaultWorkflow(projectId);

    const otherProject = await prisma.project.create({
      data: { name: 'Other Proj', organizationId: orgId, key: 'OTH' },
    });
    otherProjectId = otherProject.id;
    await service.getOrCreateDefaultWorkflow(otherProjectId);

    // Setup Members
    await prisma.projectMember.createMany({
      data: [
        { projectId, userId: adminId, role: ProjectRole.ADMIN },
        { projectId, userId: memberId, role: ProjectRole.MEMBER },
        { projectId, userId: viewerId, role: ProjectRole.VIEWER },
      ],
    });
  });

  describe('Board API', () => {
    it('should return 4 columns with issues ordered', async () => {
      // Create some issues
      await service.create(
        projectId,
        adminId,
        { title: 'Issue 1', status: IssueStatus.TODO },
        ProjectRole.ADMIN,
      );
      await service.create(
        projectId,
        adminId,
        { title: 'Issue 2', status: IssueStatus.TODO },
        ProjectRole.ADMIN,
      );
      await service.create(
        projectId,
        adminId,
        { title: 'Issue 3', status: IssueStatus.IN_PROGRESS },
        ProjectRole.ADMIN,
      );

      const board = await service.getBoard(projectId);

      expect(board).toHaveProperty(IssueStatus.TODO);
      expect(board).toHaveProperty(IssueStatus.IN_PROGRESS);
      expect(board).toHaveProperty(IssueStatus.IN_PREVIEW);
      expect(board).toHaveProperty(IssueStatus.DONE);

      expect(board[IssueStatus.TODO].length).toBe(2);
      expect(board[IssueStatus.IN_PROGRESS].length).toBe(1);
      expect(board[IssueStatus.IN_PREVIEW].length).toBe(0);
      expect(board[IssueStatus.DONE].length).toBe(0);

      // Verify sorting by fractional index
      const t1 = board[IssueStatus.TODO][0];
      const t2 = board[IssueStatus.TODO][1];
      expect(t1.order < t2.order).toBe(true);
    });
  });

  describe('Move API', () => {
    let i1: string, i2: string, i3: string, i4: string;

    beforeEach(async () => {
      // Create 4 issues in TODO
      const issue1 = await service.create(
        projectId,
        adminId,
        { title: 'I1' },
        ProjectRole.ADMIN,
      );
      const issue2 = await service.create(
        projectId,
        adminId,
        { title: 'I2' },
        ProjectRole.ADMIN,
      );
      const issue3 = await service.create(
        projectId,
        adminId,
        { title: 'I3' },
        ProjectRole.ADMIN,
      );
      const issue4 = await service.create(
        projectId,
        adminId,
        { title: 'I4' },
        ProjectRole.ADMIN,
      );

      i1 = issue1.id;
      i2 = issue2.id;
      i3 = issue3.id;
      i4 = issue4.id;
    });

    it('should prevent VIEWER from moving issues', async () => {
      await expect(
        service.moveIssue(
          projectId,
          i1,
          viewerId,
          { status: IssueStatus.TODO },
          ProjectRole.VIEWER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow MEMBER and ADMIN to move issues', async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { projectId },
        include: { statuses: true },
      });
      const inProgressStatus = workflow?.statuses.find(s => s.category === IssueStatus.IN_PROGRESS);

      await service.moveIssue(
        projectId,
        i1,
        memberId,
        { targetWorkflowStatusId: inProgressStatus?.id },
        ProjectRole.MEMBER,
      );
      const updated1 = await prisma.issue.findUnique({ where: { id: i1 } });
      expect(updated1?.status).toBe(IssueStatus.IN_PROGRESS);
      expect(updated1?.workflowStatusId).toBe(inProgressStatus?.id);
    });

    it('should reorder within the same column (between)', async () => {
      // Currently order is: I1, I2, I3, I4
      // Move I4 between I1 and I2
      await service.moveIssue(
        projectId,
        i4,
        adminId,
        {
          status: IssueStatus.TODO,
          beforeIssueId: i2,
          afterIssueId: i1,
        },
        ProjectRole.ADMIN,
      );

      const board = await service.getBoard(projectId);
      const todo = board[IssueStatus.TODO];

      // Expected: I1, I4, I2, I3
      expect(todo[0].id).toBe(i1);
      expect(todo[1].id).toBe(i4);
      expect(todo[2].id).toBe(i2);
      expect(todo[3].id).toBe(i3);
    });

    it('should move to top of column (prepend)', async () => {
      // Move I3 to top (before I1)
      await service.moveIssue(
        projectId,
        i3,
        adminId,
        {
          status: IssueStatus.TODO,
          beforeIssueId: i1,
        },
        ProjectRole.ADMIN,
      );

      const board = await service.getBoard(projectId);
      expect(board[IssueStatus.TODO][0].id).toBe(i3);
      expect(board[IssueStatus.TODO][1].id).toBe(i1);
    });

    it('should move to bottom of column (append)', async () => {
      // Move I1 to bottom (after I4)
      await service.moveIssue(
        projectId,
        i1,
        adminId,
        {
          status: IssueStatus.TODO,
          afterIssueId: i4,
        },
        ProjectRole.ADMIN,
      );

      const board = await service.getBoard(projectId);
      const todo = board[IssueStatus.TODO];
      expect(todo[todo.length - 1].id).toBe(i1);
    });

    it('should handle cross-column move to empty column', async () => {
      // Move I2 to IN_PROGRESS
      await service.moveIssue(
        projectId,
        i2,
        adminId,
        {
          status: IssueStatus.IN_PROGRESS,
        },
        ProjectRole.ADMIN,
      );

      const board = await service.getBoard(projectId);
      expect(board[IssueStatus.IN_PROGRESS].length).toBe(1);
      expect(board[IssueStatus.IN_PROGRESS][0].id).toBe(i2);
    });

    it('should prevent IDOR: move issue from different project', async () => {
      // Create issue in other project
      const otherIssue = await service.create(
        otherProjectId,
        adminId,
        { title: 'Other' },
        ProjectRole.ADMIN,
      );

      await expect(
        service.moveIssue(
          projectId,
          otherIssue.id,
          adminId,
          { status: IssueStatus.TODO },
          ProjectRole.ADMIN,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent IDOR: neighbors from different project or column', async () => {
      const otherIssue = await service.create(
        otherProjectId,
        adminId,
        { title: 'Other' },
        ProjectRole.ADMIN,
      );

      await expect(
        service.moveIssue(
          projectId,
          i1,
          adminId,
          {
            status: IssueStatus.TODO,
            beforeIssueId: otherIssue.id,
          },
          ProjectRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);

      // Neighbor in wrong column
      const inProgress = await service.create(
        projectId,
        adminId,
        { title: 'IP', status: IssueStatus.IN_PROGRESS },
        ProjectRole.ADMIN,
      );
      await expect(
        service.moveIssue(
          projectId,
          i1,
          adminId,
          {
            status: IssueStatus.TODO,
            afterIssueId: inProgress.id,
          },
          ProjectRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle concurrent moves correctly', async () => {
      const p = [];
      for (let i = 0; i < 5; i++) {
        p.push(
          service.create(
            projectId,
            adminId,
            { title: `C${i}` },
            ProjectRole.ADMIN,
          ),
        );
      }
      const created = await Promise.all(p);

      const movePromises = created.map((issue) =>
        service.moveIssue(
          projectId,
          issue.id,
          adminId,
          { status: IssueStatus.IN_PROGRESS },
          ProjectRole.ADMIN,
        ),
      );

      await Promise.all(movePromises);

      const board = await service.getBoard(projectId);
      const inProgress = board[IssueStatus.IN_PROGRESS];

      expect(inProgress.length).toBe(5);

      const orders = inProgress.map((i) => i.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(5);
    }, 60000);

    it('should rollback transaction on failure (invalid fractional indexing combination)', async () => {
      await expect(
        service.moveIssue(
          projectId,
          i3,
          adminId,
          {
            status: IssueStatus.TODO,
            afterIssueId: i2,
            beforeIssueId: i1,
          },
          ProjectRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
