import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { OrgMembersModule } from './modules/org-members/org-members.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ProjectMembersModule } from './modules/project-members/project-members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // load: [jwtConfig], // ponytial: load jwtConfig when available
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    OrgMembersModule,
    InvitationsModule,
    ProjectsModule,
    ProjectMembersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
