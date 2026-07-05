import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { MfaService } from './services/mfa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshUseCase } from './use-cases/refresh.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { MfaUseCase } from './use-cases/mfa.use-case';
import { OAuthLoginUseCase } from './use-cases/oauth-login.use-case';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    MfaService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    MfaUseCase,
    OAuthLoginUseCase,
  ],
  exports: [PasswordService, TokenService],
})
export class AuthModule {}
