import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

/** MFA por TOTP (compatível com Google Authenticator, Authy, etc.). */
@Injectable()
export class MfaService {
  private readonly issuer = 'Chamados SaaS';

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(email: string, secret: string): string {
    return authenticator.keyuri(email, this.issuer, secret);
  }

  qrCodeDataUrl(otpauthUrl: string): Promise<string> {
    return toDataURL(otpauthUrl);
  }

  verify(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
