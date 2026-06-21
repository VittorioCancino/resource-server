import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthLoginController } from './auth-login.controller';
import { InternalAuthController } from './internal-auth.controller';
import { InternalAuthService } from './internal-auth.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AuthLoginController, InternalAuthController],
  providers: [InternalAuthService],
})
export class InternalAuthModule {}
