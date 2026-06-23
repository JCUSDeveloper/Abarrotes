import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../../auth/types/jwt-payload";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): JwtPayload => {
  return context.switchToHttp().getRequest<{ user: JwtPayload }>().user;
});
