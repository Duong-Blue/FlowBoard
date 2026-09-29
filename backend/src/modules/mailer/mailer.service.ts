import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConsoleMode = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const mode = this.configService.get<string>('MAILER_MODE');
    const env = this.configService.get<string>('NODE_ENV');

    if (mode === 'console') {
      this.isConsoleMode = true;
      this.logger.log(
        'Mailer is running in console mode. Emails will be logged to console.',
      );
      return;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (env === 'production') {
      if (!host || !port || !user || !pass) {
        throw new Error(
          'SMTP configuration is missing or incomplete in production environment.',
        );
      }
    }

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`Mailer configured with SMTP host: ${host}`);
    } else {
      this.logger.warn(
        'SMTP configuration not provided, mailer will not be able to send real emails.',
      );
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const env = this.configService.get<string>('NODE_ENV');

    if (this.isConsoleMode) {
      this.logger.log(`[Console Mail] Password reset for ${email}.`);
      if (env !== 'production') {
        this.logger.log(`[Console Mail] Code: ${code}`);
      } else {
        this.logger.log(`[Console Mail] Code: ***`);
      }
      return;
    }

    if (!this.transporter) {
      if (env === 'production') {
        throw new Error(
          'SMTP configuration is missing or incomplete. Cannot send email in production.',
        );
      }
      this.logger.warn(
        `Would send password reset email to ${email} (Transporter not configured)`,
      );
      return;
    }

    const from =
      this.configService.get<string>('SMTP_FROM') || 'noreply@flowboard.local';

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${code}`,
        html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      if (env === 'production') {
        throw new Error('Failed to send email via SMTP in production.');
      }
    }
  }
}
