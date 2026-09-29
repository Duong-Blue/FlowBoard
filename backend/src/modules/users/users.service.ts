import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { Multer } from 'multer';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async getOauthProviders(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.oauthAccounts.map((a) => a.provider);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash)
      throw new BadRequestException('User does not have a password set');

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) throw new ForbiddenException('Invalid current password');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);

    return { success: true };
  }

  async setPassword(userId: string, dto: SetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.passwordHash)
      throw new BadRequestException('Password is already set');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }

  private mapToProfileDto(user: any): UserProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      theme: user.theme,
      language: user.language,
      isActive: user.isActive,
      createdAt: user.createdAt,
      hasPassword: Boolean(user.passwordHash),
      oauthProviders: user.oauthAccounts
        ? user.oauthAccounts.map((a) => a.provider)
        : [],
    };
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.mapToProfileDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.displayName !== undefined)
      data.displayName = dto.displayName === '' ? null : dto.displayName;
    if (dto.bio !== undefined) data.bio = dto.bio === '' ? null : dto.bio;
    if (dto.theme !== undefined) data.theme = dto.theme;
    if (dto.language !== undefined) data.language = dto.language;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { oauthAccounts: true },
    });
    return this.mapToProfileDto(user);
  }

  async uploadAvatar(
    userId: string,
    file: Multer.File,
  ): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      user.avatarUrl &&
      user.avatarUrl.startsWith('/api/users/me/avatar/download?path=')
    ) {
      const oldPath = new URL(
        'http://localhost' + user.avatarUrl,
      ).searchParams.get('path');
      if (oldPath) {
        await this.storage.deleteFile(oldPath).catch(() => {});
      }
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const storedName = `${randomUUID()}${ext}`;
    const storagePath = `avatars/${userId}/${storedName}`;

    await this.storage.saveFile(file.buffer, storagePath);

    const avatarUrl = `/api/users/me/avatar/download?path=${encodeURIComponent(storagePath)}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { oauthAccounts: true },
    });

    return this.mapToProfileDto(updatedUser);
  }

  async deleteAvatar(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      user.avatarUrl &&
      user.avatarUrl.startsWith('/api/users/me/avatar/download?path=')
    ) {
      const oldPath = new URL(
        'http://localhost' + user.avatarUrl,
      ).searchParams.get('path');
      if (oldPath) {
        await this.storage.deleteFile(oldPath).catch(() => {});
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      include: { oauthAccounts: true },
    });

    return this.mapToProfileDto(updatedUser);
  }

  async getAvatarStream(userId: string, requestedPath?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.avatarUrl)
      throw new NotFoundException('Avatar not found');

    let storagePath = requestedPath;
    if (!storagePath) {
      const url = new URL('http://localhost' + user.avatarUrl);
      storagePath = url.searchParams.get('path');
    }

    if (!storagePath) throw new NotFoundException('Avatar not found');

    try {
      return await this.storage.getFileStream(storagePath);
    } catch {
      throw new NotFoundException('Avatar file not found');
    }
  }

  async getSessions(userId: string, currentRefreshToken: string) {
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(currentRefreshToken)
      .digest('hex');

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentToken = activeTokens.find((t) => t.tokenHash === tokenHash);
    const currentFamilyId = currentToken?.familyId;

    const families = new Map<string, any>();

    for (const token of activeTokens) {
      if (!families.has(token.familyId)) {
        families.set(token.familyId, {
          familyId: token.familyId,
          createdAt: token.createdAt,
          lastUsedAt: token.createdAt,
          expiresAt: token.expiresAt,
          isCurrent: token.familyId === currentFamilyId,
        });
      } else {
        const family = families.get(token.familyId);
        if (token.createdAt > family.lastUsedAt) {
          family.lastUsedAt = token.createdAt;
          family.expiresAt = token.expiresAt;
        }
      }
    }

    return Array.from(families.values());
  }

  async deleteSession(userId: string, familyId: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, familyId },
    });

    if (tokens.length === 0) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async deleteAllOtherSessions(userId: string, currentRefreshToken: string) {
    const tokenHash = require('crypto')
      .createHash('sha256')
      .update(currentRefreshToken)
      .digest('hex');
    const currentToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!currentToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        familyId: { not: currentToken.familyId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.passwordHash) {
      if (!dto.password)
        throw new BadRequestException('Password is required to delete account');
      const isValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isValid) throw new ForbiddenException('Invalid password');
    } else {
      if (dto.confirmation !== 'DELETE')
        throw new BadRequestException(
          'Confirmation text must be exactly "DELETE"',
        );
    }

    const ownedOrgs = await this.prisma.organizationMember.findMany({
      where: { userId, role: 'OWNER' },
    });

    if (ownedOrgs.length > 0) {
      for (const orgMember of ownedOrgs) {
        const ownerCount = await this.prisma.organizationMember.count({
          where: { organizationId: orgMember.organizationId, role: 'OWNER' },
        });
        if (ownerCount === 1) {
          throw new BadRequestException(
            'Cannot delete account while being the sole owner of an organization. Transfer ownership or delete the organization first.',
          );
        }
      }
    }

    const oldAvatarUrl = user.avatarUrl;

    await this.prisma.$transaction([
      this.prisma.projectMember.deleteMany({ where: { userId } }),
      this.prisma.organizationMember.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    if (
      oldAvatarUrl &&
      oldAvatarUrl.startsWith('/api/users/me/avatar/download?path=')
    ) {
      const oldPath = new URL(
        'http://localhost' + oldAvatarUrl,
      ).searchParams.get('path');
      if (oldPath) {
        await this.storage.deleteFile(oldPath).catch(() => {});
      }
    }

    return { message: 'Account successfully deleted' };
  }
}
