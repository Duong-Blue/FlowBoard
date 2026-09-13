import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembersController } from './org-members.controller';
import { OrgMembersService } from './org-members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('OrgMembersController', () => {
  let controller: OrgMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgMembersController],
      providers: [
        {
          provide: OrgMembersService,
          useValue: {
            findAll: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrgMembersController>(OrgMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
