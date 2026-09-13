import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembersController } from './org-members.controller';

describe('OrgMembersController', () => {
  let controller: OrgMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgMembersController],
    }).compile();

    controller = module.get<OrgMembersController>(OrgMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
