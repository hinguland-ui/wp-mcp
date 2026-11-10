import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * WebSocket is used only for the live activity feed on the dashboard.
 * Clients authenticate with the same dashboard JWT and join a per-user room.
 */
@WebSocketGateway({ namespace: '/live', cors: { origin: process.env.WEB_URL } })
export class LiveGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(private readonly jwt: JwtService) {}

  async handleConnection(socket: Socket) {
    try {
      const token = (socket.handshake.auth as { token?: string }).token ?? '';
      const p = await this.jwt.verifyAsync<{ sub: string }>(token);
      await socket.join(`user:${p.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}

@Module({ providers: [LiveGateway], exports: [LiveGateway] })
export class EventsModule {}
