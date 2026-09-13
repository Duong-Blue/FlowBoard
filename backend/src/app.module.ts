import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { OrgMembersModule } from './modules/org-members/org-members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    OrganizationsModule,
    OrgMembersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
