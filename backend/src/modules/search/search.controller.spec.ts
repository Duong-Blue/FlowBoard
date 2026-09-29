import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { BadRequestException } from '@nestjs/common';
import { SearchEntityType } from './dto/search-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { vi } from 'vitest';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: {
            fullSearch: vi.fn(),
            getSuggestions: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  describe('search', () => {
    it('should throw BadRequestException if issue filters used on non-issue search', async () => {
      const req = { user: { userId: 'user-1' } };
      const query = {
        type: SearchEntityType.PROJECT,
        priority: 'HIGH',
      };

      await expect(controller.search(req, query as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.search(req, query as any)).rejects.toThrow(
        'Issue filters cannot be used when searching non-issue entities',
      );
    });

    it('should allow issue filters for issue search', async () => {
      const req = { user: { userId: 'user-1' } };
      const query = {
        type: SearchEntityType.ISSUE,
        priority: 'HIGH',
      };

      vi.spyOn(service, 'fullSearch').mockResolvedValue({
        items: [],
        meta: {},
      } as any);

      const result = await controller.search(req, query as any);
      expect(result).toEqual({ items: [], meta: {} });
      expect(service.fullSearch).toHaveBeenCalledWith('user-1', query);
    });

    it('should not throw if no issue filters are used on non-issue search', async () => {
      const req = { user: { userId: 'user-1' } };
      const query = {
        type: SearchEntityType.USER,
        q: 'test',
      };

      vi.spyOn(service, 'fullSearch').mockResolvedValue({
        items: [],
        meta: {},
      } as any);

      const result = await controller.search(req, query as any);
      expect(result).toEqual({ items: [], meta: {} });
      expect(service.fullSearch).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('getSuggestions', () => {
    it('should call searchService.getSuggestions', async () => {
      const req = { user: { userId: 'user-1' } };
      const query = { q: 'test' };

      vi.spyOn(service, 'getSuggestions').mockResolvedValue({} as any);

      await controller.getSuggestions(req, query as any);
      expect(service.getSuggestions).toHaveBeenCalledWith('user-1', query);
    });
  });
});
