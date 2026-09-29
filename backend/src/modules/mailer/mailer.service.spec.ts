import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('nodemailer');

describe('MailerService', () => {
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue(true),
    };
    (nodemailer.createTransport as any).mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createService = async (configValues: Record<string, any>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    return module.get<MailerService>(MailerService);
  };

  it('should create transporter with SMTP credentials', async () => {
    await createService({
      SMTP_HOST: 'smtp.test.local',
      SMTP_PORT: 587,
      SMTP_USER: 'testuser',
      SMTP_PASS: 'testpass',
      NODE_ENV: 'development',
      MAILER_MODE: 'smtp',
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.local',
      port: 587,
      secure: false,
      auth: { user: 'testuser', pass: 'testpass' },
    });
  });

  it('should throw error in production if SMTP is incomplete', async () => {
    await expect(
      createService({
        NODE_ENV: 'production',
        MAILER_MODE: 'smtp',
        SMTP_HOST: 'smtp.test.local',
      }),
    ).rejects.toThrow(
      'SMTP configuration is missing or incomplete in production environment.',
    );
  });

  it('should support console mode', async () => {
    const service = await createService({
      MAILER_MODE: 'console',
      NODE_ENV: 'development',
    });
    const loggerSpy = vi
      .spyOn((service as any).logger, 'log')
      .mockImplementation(() => {});

    await service.sendPasswordResetCode('test@test.local', '123456');
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Console Mail] Password reset for test@test.local',
      ),
    );
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  it('should not log code in console mode when production', async () => {
    const service = await createService({
      MAILER_MODE: 'console',
      NODE_ENV: 'production',
    });
    const loggerSpy = vi
      .spyOn((service as any).logger, 'log')
      .mockImplementation(() => {});

    await service.sendPasswordResetCode('test@test.local', '123456');
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Console Mail] Code: ***'),
    );
    expect(loggerSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('123456'),
    );
  });

  it('should send email using transporter', async () => {
    const service = await createService({
      SMTP_HOST: 'smtp.test.local',
      SMTP_PORT: 587,
      SMTP_USER: 'testuser',
      SMTP_PASS: 'testpass',
      SMTP_FROM: 'test@domain.com',
      NODE_ENV: 'development',
    });

    await service.sendPasswordResetCode('user@test.local', '123456');

    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: 'test@domain.com',
      to: 'user@test.local',
      subject: 'Password Reset Code',
      text: 'Your password reset code is: 123456',
      html: '<p>Your password reset code is: <strong>123456</strong></p>',
    });
  });
});
