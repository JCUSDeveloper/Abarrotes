import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}
  @Post("login") @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto); this.setRefreshCookie(response, result.refreshToken); return { accessToken: result.accessToken, user: result.user };
  }
  @Post("refresh") @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies?.refreshToken as string); this.setRefreshCookie(response, result.refreshToken); return { accessToken: result.accessToken, user: result.user };
  }
  @Post("logout") @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.refreshToken as string | undefined); response.clearCookie("refreshToken", { path: "/api/v1/auth" });
  }
  private setRefreshCookie(response: Response, token: string) {
    response.cookie("refreshToken", token, { httpOnly: true, secure: this.config.get("NODE_ENV") === "production", sameSite: "lax", path: "/api/v1/auth", maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
}
