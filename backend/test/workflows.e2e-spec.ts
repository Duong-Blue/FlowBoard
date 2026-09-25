import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('WorkflowsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT and Role Protection', () => {
    it('/projects/:projectId/workflows (GET) - should return 401 without JWT', () => {
      return request(app.getHttpServer())
        .get('/projects/test-project-id/workflows')
        .expect(401);
    });

    it('/projects/:projectId/workflows/statuses (POST) - should return 401 without JWT', () => {
      return request(app.getHttpServer())
        .post('/projects/test-project-id/workflows/statuses')
        .send({
          name: 'Test Status',
          category: 'TODO',
        })
        .expect(401);
    });

    it('/projects/:projectId/workflows/transitions (POST) - should return 401 without JWT', () => {
      return request(app.getHttpServer())
        .post('/projects/test-project-id/workflows/transitions')
        .send({
          fromStatusId: 'status-1',
          toStatusId: 'status-2',
        })
        .expect(401);
    });

    it('/projects/:projectId/workflows/transitions/matrix (PUT) - should return 401 without JWT', () => {
      return request(app.getHttpServer())
        .put('/projects/test-project-id/workflows/transitions/matrix')
        .send({
          transitions: [],
        })
        .expect(401);
    });
  });
});
