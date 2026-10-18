import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
// Pakai di controller: @Roles(Role.PENGGERAK, Role.ADMIN)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
