import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../database/prisma.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  const mockPrisma = {
    $transaction: (cb) => cb(mockPrisma),
    organization: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizationMember: { create: vi.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    vi.clearAllMocks();
  });

  it('create: should create org and owner member', async () => {
    mockPrisma.organization.create.mockResolvedValue({ id: 'org1' });
    await service.create('u1', { name: 'test' });
    expect(mockPrisma.organization.create).toHaveBeenCalled();
    expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
      data: { organizationId: 'org1', userId: 'u1', role: 'OWNER' },
    });
  });

  it('findAllForUser: should return orgs', async () => {
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org1' }]);
    const res = await service.findAllForUser('u1');
    expect(res).toHaveLength(1);
  });
});
