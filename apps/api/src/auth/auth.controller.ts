import { Body, Controller, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { TenantCtx } from '../common/tenant/tenant-context.decorator';
import type { TenantContext } from '@gestion-granjas/shared';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, getRefreshTokenTtlMs } from './auth.crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { result, refreshToken } = await this.authService.login(body as never);
    this.setRefreshCookie(res, refreshToken);
    return { data: result };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const { result, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, newRefreshToken);
    return { data: result };
  }

  @Post('logout')
  async logout(
    @TenantCtx() ctx: TenantContext,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await this.authService.logout(ctx, refreshToken);
    this.clearRefreshCookie(res);
    return { data: { ok: true } };
  }

  @Patch('granja-activa')
  async setGranjaActiva(@TenantCtx() ctx: TenantContext, @Body() body: unknown) {
    const data = await this.authService.setGranjaActiva(ctx, body);
    return { data };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: getRefreshTokenTtlMs(),
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
    });
  }
}
