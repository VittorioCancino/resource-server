import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  LabUserRegistrationController,
  ServiceUserRegistrationController,
  UserRegistrationController,
} from './user-registration.controller';
import { UserRegistrationService } from './user-registration.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    UserRegistrationController,
    LabUserRegistrationController,
    ServiceUserRegistrationController,
  ],
  providers: [UserRegistrationService],
})
export class UserRegistrationModule {}
