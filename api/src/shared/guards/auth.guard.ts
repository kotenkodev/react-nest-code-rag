import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from '../types/request.types';

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const email =
      (request.headers['x-user-email'] as string) ||
      (request.query?.email as string);

    if (!email) {
      throw new UnauthorizedException('No email provided');
    }

    request.user = {
      email,
    };

    return true;
  }
}
