import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/** Hashing de senha com Argon2id (parâmetros OWASP-recomendados). */
@Injectable()
export class PasswordService {
  private readonly options = {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  };

  hash(senha: string): Promise<string> {
    return hash(senha, this.options);
  }

  verify(hashArmazenado: string, senha: string): Promise<boolean> {
    return verify(hashArmazenado, senha);
  }
}
