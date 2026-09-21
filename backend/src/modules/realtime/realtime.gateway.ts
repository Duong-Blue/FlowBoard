import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { OnModuleDestroy } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  public userSocketMap = new Map<string, Set<Socket>>();
  private expirationMap = new Map<Socket, number>();
  private sweepInterval: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.sweepInterval = setInterval(() => this.sweepExpiredClients(), 15000);
  }

  onModuleDestroy() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
    }
  }

  private sweepExpiredClients() {
    const now = Math.floor(Date.now() / 1000);
    for (const [client, exp] of this.expirationMap.entries()) {
      if (now >= exp) {
        client.disconnect(true);
      }
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'secret',
      });

      if (payload.exp) {
        if (Math.floor(Date.now() / 1000) >= payload.exp) {
          client.disconnect(true);
          return;
        }
        this.expirationMap.set(client, payload.exp);
      }

      const userId = payload.sub;
      client.data.user = { id: userId, email: payload.email };

      let sockets = this.userSocketMap.get(userId);
      if (!sockets) {
        sockets = new Set<Socket>();
        this.userSocketMap.set(userId, sockets);
      }
      sockets.add(client);

      client.join(`user:${userId}`);
    } catch (e) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.expirationMap.delete(client);
    const userId = client.data?.user?.id;
    if (userId) {
      const sockets = this.userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(client);
        if (sockets.size === 0) {
          this.userSocketMap.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('subscribe:project')
  async handleSubscribeProject(client: Socket, payload: { projectId: string }) {
    const userId = client.data?.user?.id;
    if (!userId || !payload.projectId) return { status: 'error' };

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId: payload.projectId, userId },
    });

    if (member) {
      client.join(`project:${payload.projectId}`);
      return { status: 'joined', projectId: payload.projectId };
    }
    return { status: 'error', message: 'Not a member' };
  }

  @SubscribeMessage('unsubscribe:project')
  handleUnsubscribeProject(client: Socket, payload: { projectId: string }) {
    if (payload.projectId) {
      client.leave(`project:${payload.projectId}`);
    }
    return { status: 'left' };
  }
}
