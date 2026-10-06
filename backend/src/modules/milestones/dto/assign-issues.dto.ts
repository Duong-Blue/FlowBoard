import { IsArray, IsString } from 'class-validator';

export class AssignIssuesDto {
  @IsArray()
  @IsString({ each: true })
  issueIds: string[];
}
