import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Papel } from '@prisma/client';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { MfaTokenDto } from './dto/mfa.dto';

import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshUseCase } from './use-cases/refresh.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { MfaUseCase } from './use-cases/mfa.use-case';
import {
  OAuthLoginUseCase,
  OAuthProfile,
} from './use-cases/oauth-login.use-case';
import { RequestMeta } from './services/token.service';

const REFRESH_COOKIE = 'refreshToken';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly mfaUseCase: MfaUseCase,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
  ) {}

  private meta(req: Request): RequestMeta {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Cria empresa (tenant) + primeiro SUPER_ADMIN' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.registerUseCase.execute(dto, this.meta(req));
    this.setRefreshCookie(res, resultado.refreshToken);
    return resultado;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login por e-mail e senha (MFA se ativo)' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.loginUseCase.execute(dto, this.meta(req));
    this.setRefreshCookie(res, resultado.refreshToken);
    return resultado;
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Rotaciona o par de tokens' })
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException('refresh token não fornecido');
    }
    const resultado = await this.refreshUseCase.execute(token, this.meta(req));
    this.setRefreshCookie(res, resultado.refreshToken);
    return resultado;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoga o refresh token)' })
  @Post('logout')
  async logout(
    @Body() dto: RefreshDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    await this.logoutUseCase.execute(token, user, this.meta(req));
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @ApiBearerAuth()
  @Roles(Papel.SUPER_ADMIN, Papel.ADMIN)
  @ApiOperation({ summary: 'Exemplo de rota restrita por papel (RBAC)' })
  @Get('admin/ping')
  adminPing(@CurrentUser() user: AuthenticatedUser) {
    return { ok: true, papel: user.papel };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia MFA: retorna segredo, otpauth e QR code' })
  @Post('mfa/setup')
  setupMfa(@CurrentUser('id') userId: string) {
    return this.mfaUseCase.setup(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirma e ativa o MFA' })
  @Post('mfa/enable')
  enableMfa(@CurrentUser('id') userId: string, @Body() dto: MfaTokenDto) {
    return this.mfaUseCase.enable(userId, dto.token);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativa o MFA' })
  @Post('mfa/disable')
  disableMfa(@CurrentUser('id') userId: string, @Body() dto: MfaTokenDto) {
    return this.mfaUseCase.disable(userId, dto.token);
  }

  @Public()
  @ApiOperation({ summary: 'Inicia o fluxo OAuth Google' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // O redirecionamento é tratado pelo AuthGuard('google').
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.oauthLoginUseCase.execute(
      req.user as OAuthProfile,
      this.meta(req),
    );
    this.setRefreshCookie(res, resultado.refreshToken);
    return resultado;
  }

  @Public()
  @ApiOperation({ summary: 'Inicia o fluxo OAuth GitHub' })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth(): void {
    // O redirecionamento é tratado pelo AuthGuard('github').
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.oauthLoginUseCase.execute(
      req.user as OAuthProfile,
      this.meta(req),
    );
    this.setRefreshCookie(res, resultado.refreshToken);
    return resultado;
  }
}
