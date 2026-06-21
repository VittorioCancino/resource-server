import { Injectable } from '@nestjs/common';
import { normalizeEmail } from '../common/identity/user-identity.util';
import { verifyPassword } from '../common/security/password-hash.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  VerifyCredentialsDto,
  VerifyCredentialsResponseDto,
} from './dto/verify-credentials.dto';

@Injectable()
export class InternalAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyCredentials(
    verifyCredentialsDto: VerifyCredentialsDto,
  ): Promise<VerifyCredentialsResponseDto> {
    const email = normalizeEmail(verifyCredentialsDto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        subject: true,
        email: true,
        name: true,
        status: true,
        credential: {
          select: {
            passwordHash: true,
          },
        },
      },
    });

    if (!user?.credential || user.status !== 'ACTIVE') {
      return { authenticated: false };
    }

    const passwordMatches = await verifyPassword(
      verifyCredentialsDto.password,
      user.credential.passwordHash,
    );

    if (!passwordMatches) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      subject: user.subject,
      email: user.email,
      name: user.name,
    };
  }
}
