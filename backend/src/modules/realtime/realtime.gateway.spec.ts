import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway } from './realtime.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Socket } from 'socket.io';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: JwtService;

  const mockSocket = () => {
    return {
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
      },
      data: {},
      disconnect: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
    } as unknown as Socket;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000000000000)); // 2001-09-09T01:46:40.000Z

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: JwtService,
          useValue: {
            verify: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    gateway.onModuleDestroy(); // cleanup interval
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('handleConnection', () => {
    it('should disconnect socket without token', async () => {
      const client = mockSocket();
      client.handshake.auth = undefined;
      client.handshake.headers = undefined;

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should reject connection if token is already expired', async () => {
      const client = mockSocket();
      const currentEpoch = Math.floor(Date.now() / 1000);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user1',
        email: 'user1@example.com',
        exp: currentEpoch - 10, // expired 10 seconds ago
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(gateway['expirationMap'].has(client)).toBe(false);
      expect(gateway['userSocketMap'].has('user1')).toBe(false);
    });

    it('should accept connection with valid token and set expiration', async () => {
      const client = mockSocket();
      const currentEpoch = Math.floor(Date.now() / 1000);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user2',
        email: 'user2@example.com',
        exp: currentEpoch + 3600, // valid for 1 hour
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(gateway['expirationMap'].get(client)).toBe(currentEpoch + 3600);
      expect(gateway['userSocketMap'].get('user2')?.has(client)).toBe(true);
      expect(client.join).toHaveBeenCalledWith('user:user2');
    });
  });

  describe('sweepExpiredClients', () => {
    it('should disconnect clients when their token expires during sweep', async () => {
      const client1 = mockSocket();
      const client2 = mockSocket();
      const currentEpoch = Math.floor(Date.now() / 1000);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user1',
        email: 'user1@example.com',
        exp: currentEpoch + 10,
      });
      await gateway.handleConnection(client1);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user2',
        email: 'user2@example.com',
        exp: currentEpoch + 30,
      });
      await gateway.handleConnection(client2);

      expect(client1.disconnect).not.toHaveBeenCalled();
      expect(client2.disconnect).not.toHaveBeenCalled();

      // Advance time by 15 seconds
      vi.advanceTimersByTime(15000);

      expect(client1.disconnect).toHaveBeenCalledWith(true);
      expect(client2.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up expirationMap and userSocketMap on disconnect', async () => {
      const client = mockSocket();
      const currentEpoch = Math.floor(Date.now() / 1000);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user3',
        email: 'user3@example.com',
        exp: currentEpoch + 3600,
      });

      await gateway.handleConnection(client);

      expect(gateway['expirationMap'].has(client)).toBe(true);
      expect(gateway['userSocketMap'].has('user3')).toBe(true);

      gateway.handleDisconnect(client);

      expect(gateway['expirationMap'].has(client)).toBe(false);
      expect(gateway['userSocketMap'].has('user3')).toBe(false);
    });

    it('should handle disconnect when user has multiple sockets', async () => {
      const client1 = mockSocket();
      const client2 = mockSocket();
      const currentEpoch = Math.floor(Date.now() / 1000);

      vi.mocked(jwtService.verify).mockReturnValue({
        sub: 'user4',
        email: 'user4@example.com',
        exp: currentEpoch + 3600,
      });

      await gateway.handleConnection(client1);
      await gateway.handleConnection(client2);

      expect(gateway['userSocketMap'].get('user4')?.size).toBe(2);

      gateway.handleDisconnect(client1);

      expect(gateway['expirationMap'].has(client1)).toBe(false);
      expect(gateway['userSocketMap'].get('user4')?.size).toBe(1);
      expect(gateway['userSocketMap'].get('user4')?.has(client2)).toBe(true);
    });
  });
});
