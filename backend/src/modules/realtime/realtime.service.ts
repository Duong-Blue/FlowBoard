import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';
import { randomUUID } from 'crypto';

interface SocketEvent<T> {
  eventId: string;
  type: string;
  timestamp: string;
  correlationId?: string;
  payload: T;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  private wrapEvent<T>(type: string, payload: T): SocketEvent<T> {
    return {
      eventId: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  private broadcastToProject<T>(projectId: string, type: string, payload: T) {
    const event: SocketEvent<T> = {
      eventId: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.gateway.server.to(`project:${projectId}`).emit(type, event);
  }

  private broadcastToUser<T>(userId: string, type: string, payload: T) {
    const event: SocketEvent<T> = {
      eventId: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.gateway.server.to(`user:${userId}`).emit(type, event);
  }

  @OnEvent('project.member.removed')
  handleProjectMemberRemoved(payload: { projectId: string; userId: string }) {
    const sockets = this.gateway.userSocketMap.get(payload.userId);
    if (sockets) {
      for (const socket of sockets) {
        socket.leave(`project:${payload.projectId}`);
      }
    }
  }

  @OnEvent('issue.created')
  handleIssueCreated(payload: any) {
    if (payload.projectId)
      this.broadcastToProject(payload.projectId, 'issue.created', payload);
  }

  @OnEvent('issue.updated')
  handleIssueUpdated(payload: any) {
    if (payload.projectId)
      this.broadcastToProject(payload.projectId, 'issue.updated', payload);
  }

  @OnEvent('issue.deleted')
  handleIssueDeleted(payload: any) {
    if (payload.projectId)
      this.broadcastToProject(payload.projectId, 'issue.deleted', payload);
  }

  @OnEvent('comment.created')
  handleCommentCreated(payload: any) {
    if (payload.projectId)
      this.broadcastToProject(payload.projectId, 'comment.created', payload);
  }

  @OnEvent('notification.new')
  handleNotificationNew(payload: any) {
    if (payload.userId)
      this.broadcastToUser(payload.userId, 'notification.new', payload);
    }

  @OnEvent('issue.moved')
  handleIssueMoved(payload: any) {
    if (payload.projectId)
      this.broadcastToProject(payload.projectId, 'issue.moved', payload);
  }
}
