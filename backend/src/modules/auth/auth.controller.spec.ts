import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(dto)).toBe(result);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      const result = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toBe(result);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh', async () => {
      const dto: RefreshDto = { refreshToken: 'old-refresh' };
      const result = {
        accessToken: 'access',
        refreshToken: 'new-refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      mockAuthService.refresh.mockResolvedValue(result);

      expect(await controller.refresh(dto)).toBe(result);
      expect(service.refresh).toHaveBeenCalledWith(dto.refreshToken);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto: ForgotPasswordDto = { email: 'test@example.com' };
      const result = {
        message:
          'If an account exists, a password reset code will be sent to the email.',
      };
      mockAuthService.forgotPassword.mockResolvedValue(result);

      expect(await controller.forgotPassword(dto)).toBe(result);
      expect(service.forgotPassword).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('verifyResetCode', () => {
    it('should call authService.verifyResetCode', async () => {
      const dto: VerifyResetCodeDto = {
        email: 'test@example.com',
        code: '123456',
      };
      const result = { resetToken: 'some-token' };
      mockAuthService.verifyResetCode.mockResolvedValue(result);

      expect(await controller.verifyResetCode(dto)).toBe(result);
      expect(service.verifyResetCode).toHaveBeenCalledWith(dto.email, dto.code);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const dto: ResetPasswordDto = {
        resetToken: 'some-token',
        newPassword: 'new-password',
      };
      const result = { message: 'Password updated successfully' };
      mockAuthService.resetPassword.mockResolvedValue(result);

      expect(await controller.resetPassword(dto)).toBe(result);
      expect(service.resetPassword).toHaveBeenCalledWith(
        dto.resetToken,
        dto.newPassword,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const dto: RefreshDto = { refreshToken: 'refresh' };
      mockAuthService.logout.mockResolvedValue(undefined);

      expect(await controller.logout(dto)).toBeUndefined();
      expect(service.logout).toHaveBeenCalledWith(dto.refreshToken);
    });
  });
});
