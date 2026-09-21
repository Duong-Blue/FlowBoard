import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
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
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.usersService.updateLastLogin(user.id);
    return this.generateTokens(user);
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
      const newTokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

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
          replacedByToken: newRefreshToken.id 
        },
      });

      const name = [token.user.firstName, token.user.lastName].filter(Boolean).join(' ') || token.user.email;

      return {
        user: {
          id: token.user.id,
          email: token.user.email,
          name,
          firstName: token.user.firstName,
          lastName: token.user.lastName,
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

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    return {
      user: {
        id: user.id,
        email: user.email,
        name,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
