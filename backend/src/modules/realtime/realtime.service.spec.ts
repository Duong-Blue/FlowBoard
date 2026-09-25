
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('RealtimeService', () => {
  let service: RealtimeService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let gateway: RealtimeGateway;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let eventEmitter: EventEmitter2;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RealtimeService,
          {
            provide: RealtimeGateway,
            useValue: {
              server: {
                to: vi.fn().mockReturnThis(),
                emit: vi.fn(),
              },
            },
          },
          {
            provide: EventEmitter2,
            useValue: {
              on: vi.fn(),
              emit: vi.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<RealtimeService>(RealtimeService);
      gateway = module.get<RealtimeGateway>(RealtimeGateway);
      eventEmitter = module.get<EventEmitter2>(EventEmitter2);

      // Mock implementation of broadcastToProject for testing
      vi.spyOn(service as any, 'broadcastToProject').mockImplementation(() => {});
      // Mock implementation of broadcastToUser for testing
      vi.spyOn(service as any, 'broadcastToUser').mockImplementation(() => {});
    });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('event listeners', () => {
    it('should handle issue.created event', () => {
      const payload = { projectId: 'project-1', issue: { id: 'issue-1' } };
      service.handleIssueCreated(payload);
      expect((service as any).broadcastToProject).toHaveBeenCalledWith(
        payload.projectId,
        'issue.created',
        payload
      );
    });

    it('should handle issue.updated event', () => {
      const payload = { projectId: 'project-1', issue: { id: 'issue-1' } };
      service.handleIssueUpdated(payload);
      expect((service as any).broadcastToProject).toHaveBeenCalledWith(
        payload.projectId,
        'issue.updated',
        payload
      );
    });

    it('should handle issue.deleted event', () => {
      const payload = { projectId: 'project-1', issue: { id: 'issue-1' } };
      service.handleIssueDeleted(payload);
      expect((service as any).broadcastToProject).toHaveBeenCalledWith(
        payload.projectId,
        'issue.deleted',
        payload
      );
    });

    it('should handle comment.created event', () => {
      const payload = { projectId: 'project-1', comment: { id: 'comment-1' } };
      service.handleCommentCreated(payload);
      expect((service as any).broadcastToProject).toHaveBeenCalledWith(
        payload.projectId,
        'comment.created',
        payload
      );
    });

    it('should handle notification.new event', () => {
      const payload = { userId: 'user-1', notification: { id: 'notif-1' } };
      service.handleNotificationNew(payload);
      expect((service as any).broadcastToUser).toHaveBeenCalledWith(
        payload.userId,
        'notification.new',
        payload
      );
    });

    // New test for issue.moved event
    it('should handle issue.moved event', () => {
      const payload = { projectId: 'project-1', issue: { id: 'issue-1' } };
      // Directly call the handler as if EventEmitter emitted it
      service.handleIssueMoved(payload);
      expect((service as any).broadcastToProject).toHaveBeenCalledWith(
        payload.projectId,
        'issue.moved',
        payload
      );
    });
  });
});

// Helper function to simulate event emission (if needed, not used in current test structure)
// function emitEvent(eventEmitter: EventEmitter2, eventName: string, payload: any) {
//   eventEmitter.emit(eventName, payload);
// } 
