import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from './common/http/http.module';
import { LabsModule } from './labs/labs.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, HttpModule, LabsModule, UsersModule],
})
export class AppModule {}
