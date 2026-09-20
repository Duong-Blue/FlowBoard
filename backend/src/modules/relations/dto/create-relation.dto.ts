import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { RelationType } from '@prisma/client';

export class CreateRelationDto {
  @IsUUID()
  @IsNotEmpty()
  targetIssueId: string;

  @IsEnum(RelationType)
  @IsNotEmpty()
  type: RelationType;
}
