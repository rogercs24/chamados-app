import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantContextService } from './tenant-context.service';

/**
 * Abre um escopo de AsyncLocalStorage no início de cada requisição.
 * Guards e handlers subsequentes rodam dentro deste contexto.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly ctx: TenantContextService) {}

  use(_req: Request, _res: Response, next: NextFunction): void {
    this.ctx.run({}, () => next());
  }
}
