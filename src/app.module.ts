import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from './common/http/http.module';
import { InternalAuthModule } from './internal-auth/internal-auth.module';
import { ServicesModule } from './services/services.module';
import { UserRegistrationModule } from './user-registration/user-registration.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    InternalAuthModule,
    ServicesModule,
    UserRegistrationModule,
    UsersModule,
  ],
})
export class AppModule {}
