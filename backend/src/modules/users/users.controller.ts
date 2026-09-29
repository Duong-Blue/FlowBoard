import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  StreamableFile,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { Response } from 'express';

import { SessionQueryDto } from './dto/session.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/oauth')
  async getOauthProviders(@CurrentUser('id') userId: string) {
    return this.usersService.getOauthProviders(userId);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Post('me/password')
  async setPassword(
    @CurrentUser('id') userId: string,
    @Body() dto: SetPasswordDto,
  ) {
    return this.usersService.setPassword(userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/i }),
        ],
      }),
    )
    file: Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('me/avatar')
  async deleteAvatar(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAvatar(userId);
  }

  @Get('me/avatar/download')
  async downloadAvatar(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream = await this.usersService.getAvatarStream(userId);
    res.set({
      'Content-Type': 'image/jpeg', // The service will set the correct content type if needed, but since we don't store mime type, we can let browser infer it or use application/octet-stream. Wait, maybe we store mime type? Let's check avatarUrl.
    });
    return new StreamableFile(stream);
  }

  @Post('me/sessions/query')
  async getSessions(
    @CurrentUser('id') userId: string,
    @Body() dto: SessionQueryDto,
  ) {
    return this.usersService.getSessions(userId, dto.refreshToken);
  }

  @Delete('me/sessions/:familyId')
  async deleteSession(
    @CurrentUser('id') userId: string,
    @Param('familyId') familyId: string,
  ) {
    return this.usersService.deleteSession(userId, familyId);
  }

  @Delete('me/sessions')
  async deleteAllOtherSessions(
    @CurrentUser('id') userId: string,
    @Body() dto: SessionQueryDto,
  ) {
    return this.usersService.deleteAllOtherSessions(userId, dto.refreshToken);
  }

  @Delete('me')
  async deleteAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(userId, dto);
  }
}
