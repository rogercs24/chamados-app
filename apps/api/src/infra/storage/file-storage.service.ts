import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { extname, join } from 'node:path';
import { Global, Injectable, Module } from '@nestjs/common';

/**
 * Armazenamento de arquivos em disco local (uploads/). Guarda um caminho
 * relativo por tenant. Em produção, trocável por S3/Cloudinary sem afetar os
 * chamadores (a interface é a mesma).
 */
@Injectable()
export class FileStorageService {
  private readonly root = join(process.cwd(), 'uploads');

  async save(
    tenantId: string,
    subdir: string,
    originalName: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = join(this.root, tenantId, subdir);
    await fs.mkdir(dir, { recursive: true });
    const nome = `${randomUUID()}${extname(originalName)}`;
    await fs.writeFile(join(dir, nome), buffer);
    return [tenantId, subdir, nome].join('/');
  }

  absolute(caminhoRelativo: string): string {
    return join(this.root, caminhoRelativo);
  }
}

@Global()
@Module({
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class StorageModule {}
