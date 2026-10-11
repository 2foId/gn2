import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { DampakService } from './dampak.service';

@Controller('dampak')
export class DampakController {
    constructor(private dampakService: DampakService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.RELAWAN)
    @Get('ringkasan')
    getRingkasan() {
        return this.dampakService.getRingkasan();
    }
}
