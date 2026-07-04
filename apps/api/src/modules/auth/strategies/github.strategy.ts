import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { OAuthProfile } from '../use-cases/oauth-login.use-case';

type DoneCallback = (err: unknown, user?: OAuthProfile | false) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') ?? 'nao-configurado',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') ?? 'nao-configurado',
      callbackURL:
        config.get<string>('GITHUB_CALLBACK_URL') ??
        'http://localhost:3333/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: DoneCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(
        new UnauthorizedException(
          'GitHub não retornou e-mail. Torne seu e-mail público ou conceda o escopo user:email.',
        ),
        false,
      );
      return;
    }
    const perfil: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email,
    };
    done(null, perfil);
  }
}
