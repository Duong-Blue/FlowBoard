import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentProjectMember = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const member = request.projectMember;
    if (!member) return null;
    return data ? member[data] : member;
  },
);
