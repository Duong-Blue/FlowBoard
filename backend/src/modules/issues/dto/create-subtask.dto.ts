import { OmitType } from '@nestjs/mapped-types';
import { CreateIssueDto } from './create-issue.dto';

export class CreateSubtaskDto extends OmitType(CreateIssueDto, [
  'type',
  'parentId',
  'startDate',
  'dueDate',
] as const) {}
