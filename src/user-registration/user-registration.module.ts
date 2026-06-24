import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  ServiceUserRegistrationController,
  UserRegistrationController,
} from './user-registration.controller';
import { UserRegistrationService } from './user-registration.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UserRegistrationController, ServiceUserRegistrationController],
  providers: [UserRegistrationService],
})
export class UserRegistrationModule {}
