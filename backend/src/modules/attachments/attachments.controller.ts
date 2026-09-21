import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../../common/guards/project-member.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';
import { Multer } from 'multer';

@Controller('api/projects/:projectId/issues/:issueId/attachments')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /image\/*|application\/pdf|text\/plain|application\/vnd.openxmlformats-officedocument.*/,
          }),
        ],
      }),
    )
    file: Multer.File,
  ) {
    return this.attachmentsService.upload(projectId, issueId, userId, file);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    return this.attachmentsService.findAll(projectId, issueId);
  }

  @Get(':attachmentId/download')
  async download(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { attachment, stream } = await this.attachmentsService.getDownloadInfo(projectId, issueId, attachmentId);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':attachmentId')
  async delete(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.attachmentsService.delete(projectId, issueId, attachmentId, userId);
  }
}
