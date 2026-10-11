import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Dipasang SETELAH JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
// Pengecekan ini murni di backend, tidak bisa dilewati dengan memodifikasi frontend.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // endpoint tidak membatasi role tertentu
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.includes(user?.role);
    if (!hasRole) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk aksi ini');
    }
    return true;
  }
}
