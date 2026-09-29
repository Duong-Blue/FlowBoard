import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { IssuesService } from './issues.service';
import { AppModule } from '../../app.module';
import { ActivityModule } from '../activity/activity.module';
import { ProjectRole, IssueStatus } from '@prisma/client';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

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
      imports: [AppModule, ActivityModule],
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
