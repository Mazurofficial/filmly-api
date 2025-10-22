import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Request as ExpressRequest } from 'express';

type CurrentUserPayload = { userId: string; email: string } | undefined;

export const CurrentUser = createParamDecorator<CurrentUserPayload>(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    type RequestWithUser = (ExpressRequest | FastifyRequest) & { user?: CurrentUserPayload };
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
