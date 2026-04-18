import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class SlackSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-ingest-secret'];
    const secret = Array.isArray(header) ? header[0] : header;
    const expected = this.config.get<string>('SLACK_INGEST_SECRET');

    const ok = typeof secret === 'string' && typeof expected === 'string' && secret === expected;
    if (!ok) {
      throw new UnauthorizedException('Invalid or missing X-Ingest-Secret');
    }

    return true;
  }
}
