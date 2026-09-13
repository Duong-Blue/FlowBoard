import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembersService } from './org-members.service';
import { PrismaService } from '../../database/prisma.service';

describe('OrgMembersService', () => {
  let service: OrgMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgMembersService,
        {
          provide: PrismaService,
          useValue: {
            orgMember: {
              findMany: vi.fn(),
              create: vi.fn(),
              delete: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrgMembersService>(OrgMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
