import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { Multer } from 'multer';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly activity: ActivityService,
  ) {}

  private async verifyIssueInProject(projectId: string, issueId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    if (issue.projectId !== projectId) {
      throw new ForbiddenException('Issue does not belong to this project');
    }
  }

  async upload(projectId: string, issueId: string, actorId: string, file: Multer.File) {
    await this.verifyIssueInProject(projectId, issueId);

    const ext = path.extname(file.originalname);
    const storedName = `${randomUUID()}${ext}`;
    const storagePath = `issues/${issueId}/${storedName}`;

    await this.storage.saveFile(file.buffer, storagePath);

    const attachment = await this.prisma.attachment.create({
      data: {
        issueId,
        originalName: file.originalname,
        storedName,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploaderId: actorId,
      },
    });

    await this.activity.createActivity(issueId, actorId, ActivityType.ATTACHMENT_UPLOADED, { attachmentId: attachment.id });

    return attachment;
  }

  async findAll(projectId: string, issueId: string) {
    await this.verifyIssueInProject(projectId, issueId);

    return this.prisma.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDownloadInfo(projectId: string, issueId: string, attachmentId: string) {
    await this.verifyIssueInProject(projectId, issueId);

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const stream = await this.storage.getFileStream(attachment.storagePath);
    return { attachment, stream };
  }

  async delete(projectId: string, issueId: string, attachmentId: string, actorId: string) {
    await this.verifyIssueInProject(projectId, issueId);

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.storage.deleteFile(attachment.storagePath);
    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    await this.activity.createActivity(issueId, actorId, ActivityType.ATTACHMENT_DELETED, { attachmentId });
    return true;
  }
}
