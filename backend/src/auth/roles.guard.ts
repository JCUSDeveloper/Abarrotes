import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@prisma/client";
import { ROLES_KEY } from "../common/decorators/roles.decorator";
import type { JwtPayload } from "./types/jwt-payload";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return Boolean(request.user && roles.includes(request.user.role));
  }
}
