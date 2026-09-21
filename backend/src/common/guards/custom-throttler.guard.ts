import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    return super.canActivate(context);
  }

  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const userId = req.user?.id;
    const ip = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    return userId ? `user:${userId}` : `ip:${ip}`;
  }
}
