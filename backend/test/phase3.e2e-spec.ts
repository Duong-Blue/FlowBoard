import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Phase 3 E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    const email = `test-${Date.now()}@example.com`;

    it('/api/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', firstName: 'First', lastName: 'Last' })
        .expect(201);
    });

    it('/api/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'password123' })
        .expect(201);
    });

    it('/api/auth/refresh (POST) - 401 unauthenticated', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect(401);
    });
  });

  describe('Org Flow', () => {
    let token: string;
    const email = `orgtest-${Date.now()}@example.com`;

    beforeAll(async () => {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123', firstName: 'First', lastName: 'Last' });
      token = regRes.body.accessToken;
    });

    it('/api/organizations (POST) - Create', () => {
      return request(app.getHttpServer())
        .post('/api/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Org1' })
        .expect(201);
    });
  });
});
