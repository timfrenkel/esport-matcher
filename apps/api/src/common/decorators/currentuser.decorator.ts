import {
  createParamDecorator,
  ExecutionContext
} from "@nestjs/common";

export interface CurrentUserPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest() as any;
    return request.user;
  }
);
