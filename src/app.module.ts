import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from './common/http/http.module';
import { InternalAuthModule } from './internal-auth/internal-auth.module';
import { LabsModule } from './labs/labs.module';
import { UserRegistrationModule } from './user-registration/user-registration.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    InternalAuthModule,
    LabsModule,
    UserRegistrationModule,
    UsersModule,
  ],
})
export class AppModule {}
