import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID, randomInt } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });
    return this.issueSessionTokens(user.id);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.usersService.updateLastLogin(user.id);
    return this.issueSessionTokens(user.id);
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    return this.prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (token.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (token.revokedAt !== null || token.replacedByToken !== null) {
        await tx.refreshToken.updateMany({
          where: { familyId: token.familyId },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      const payload = { email: token.user.email, sub: token.user.id };
      const accessToken = this.jwtService.sign(payload);

      const rawRefreshToken = randomBytes(32).toString('hex');
      const newTokenHash = createHash('sha256')
        .update(rawRefreshToken)
        .digest('hex');

      const newRefreshToken = await tx.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          familyId: token.familyId,
          userId: token.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.refreshToken.update({
        where: { id: token.id },
        data: {
          revokedAt: new Date(),
          replacedByToken: newRefreshToken.id,
        },
      });

      const name =
        [token.user.firstName, token.user.lastName].filter(Boolean).join(' ') ||
        token.user.email;

      return {
        user: {
          id: token.user.id,
          email: token.user.email,
          name,
          firstName: token.user.firstName,
          lastName: token.user.lastName,
          avatarUrl: token.user.avatarUrl,
        },
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async issueSessionTokens(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    return {
      user: {
        id: user.id,
        email: user.email,
        name,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      return {
        message:
          'If an account exists, a password reset code will be sent to the email.',
      };
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    await this.mailerService.sendPasswordResetCode(normalizedEmail, code);

    return {
      message:
        'If an account exists, a password reset code will be sent to the email.',
    };
  }

  async verifyResetCode(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeHash = createHash('sha256').update(code).digest('hex');
    const resetCode = await this.prisma.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetCode) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (resetCode.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (resetCode.attempts >= 5) {
      throw new BadRequestException(
        'Too many attempts. Please request a new reset code.',
      );
    }

    if (resetCode.codeHash !== codeHash) {
      await this.prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired reset code');
    }

    const rawResetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256')
      .update(rawResetToken)
      .digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: {
        verifiedAt: new Date(),
        resetTokenHash,
        resetTokenExpiresAt,
        attempts: 0,
      },
    });

    return { resetToken: rawResetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetCode = await this.prisma.passwordResetCode.findUnique({
      where: { resetTokenHash: tokenHash },
    });

    if (!resetCode || resetCode.consumedAt !== null) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      !resetCode.resetTokenExpiresAt ||
      resetCode.resetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetCode.userId },
        data: { passwordHash },
      });
      await tx.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { consumedAt: new Date() },
      });
      await tx.refreshToken.updateMany({
        where: { userId: resetCode.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: 'Password updated successfully' };
  }

  async cleanExpiredResetCodes(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.passwordResetCode.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { lt: cutoff } }],
      },
    });
    return result.count;
  }
}
