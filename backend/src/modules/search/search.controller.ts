import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto';
import { SearchQueryDto, SearchEntityType } from './dto/search-query.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Request() req, @Query() query: SearchQueryDto) {
    if (query.type !== SearchEntityType.ISSUE) {
      if (
        query.workflowStatusId ||
        query.statusCategory ||
        query.priority ||
        query.issueType ||
        query.assigneeId ||
        query.reporterId ||
        query.dueDateFrom ||
        query.dueDateTo
      ) {
        throw new BadRequestException(
          'Issue filters cannot be used when searching non-issue entities',
        );
      }
    }
    return this.searchService.fullSearch(req.user.userId, query);
  }

  @Get('suggestions')
  async getSuggestions(
    @Request() req,
    @Query() query: SearchSuggestionsQueryDto,
  ) {
    return this.searchService.getSuggestions(req.user.userId, query);
  }
}
