import { PasswordService } from './password.service';

describe('PasswordService (Argon2id)', () => {
  const service = new PasswordService();

  it('gera um hash que não contém a senha em texto', async () => {
    const hash = await service.hash('SenhaForte@123');
    expect(hash).not.toContain('SenhaForte');
    expect(hash.startsWith('$argon2')).toBe(true);
  });

  it('valida a senha correta e rejeita a incorreta', async () => {
    const hash = await service.hash('SenhaForte@123');
    expect(await service.verify(hash, 'SenhaForte@123')).toBe(true);
    expect(await service.verify(hash, 'senhaErrada')).toBe(false);
  });
});
