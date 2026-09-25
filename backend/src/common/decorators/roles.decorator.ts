import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ProjectRole[]) => SetMetadata(ROLES_KEY, roles);
