import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../common/types/authenticated-user';

/**
 * Gateway de tempo real. Autentica no handshake (JWT) e coloca cada cliente na
 * room `tenant:{id}` — os eventos ficam isolados por empresa (ver ADR-0002).
 * O adapter Redis (main.ts) propaga eventos entre instâncias.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const header = client.handshake.headers.authorization;
      const token =
        (client.handshake.auth?.token as string) ||
        (header ? header.replace('Bearer ', '') : undefined);
      if (!token) throw new Error('token ausente');

      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.tenantId = payload.tenantId;
      client.data.userId = payload.sub;
      void client.join(`tenant:${payload.tenantId}`);
    } catch {
      client.emit('erro', 'autenticação falhou');
      client.disconnect(true);
    }
  }

  /** Emite um evento para todos os clientes conectados de um tenant. */
  emitToTenant(tenantId: string, event: string, payload: unknown): void {
    this.server?.to(`tenant:${tenantId}`).emit(event, payload);
  }
}
