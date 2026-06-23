import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import type { JwtPayload, JwtRefreshPayload } from "./types/jwt-payload";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user?.active || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException("Credenciales incorrectas");
    return this.issueTokens(user);
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(token, { secret: this.config.getOrThrow("JWT_REFRESH_SECRET") });
      const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.tokenId }, include: { user: true } });
      if (!stored || !stored.user.active || stored.revokedAt || stored.expiresAt < new Date() || !(await compare(token, stored.tokenHash))) throw new Error("invalid");
      await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      return this.issueTokens(stored.user);
    } catch { throw new UnauthorizedException("Sesión inválida o expirada"); }
  }

  async logout(token?: string) {
    if (!token) return;
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(token, { secret: this.config.getOrThrow("JWT_REFRESH_SECRET"), ignoreExpiration: true });
      await this.prisma.refreshToken.updateMany({ where: { id: payload.tokenId, revokedAt: null }, data: { revokedAt: new Date() } });
    } catch { return; }
  }

  private async issueTokens(user: { id: string; email: string; role: Role; storeId: string | null; firstName: string; lastName: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, storeId: user.storeId };
    const tokenId = randomUUID();
    const accessToken = await this.jwt.signAsync(payload, { secret: this.config.getOrThrow("JWT_ACCESS_SECRET"), expiresIn: 15 * 60 });
    const refreshToken = await this.jwt.signAsync({ ...payload, tokenId }, { secret: this.config.getOrThrow("JWT_REFRESH_SECRET"), expiresIn: 30 * 24 * 60 * 60 });
    await this.prisma.refreshToken.create({ data: { id: tokenId, userId: user.id, tokenHash: await hash(refreshToken, 10), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, storeId: user.storeId } };
  }
}
