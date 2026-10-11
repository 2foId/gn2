import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Pakai di controller/endpoint: @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
