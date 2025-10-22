import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type CurrentUserPayload = { userId: string; email: string } | undefined;

export const CurrentUser = createParamDecorator<CurrentUserPayload>(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    type RequestWithUser = Request & { user?: CurrentUserPayload };
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
