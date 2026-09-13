import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembersService } from './org-members.service';

describe('OrgMembersService', () => {
  let service: OrgMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrgMembersService],
    }).compile();

    service = module.get<OrgMembersService>(OrgMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
