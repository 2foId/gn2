import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Ambil payload user dari request (sudah diisi JwtStrategy setelah token diverifikasi)
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
