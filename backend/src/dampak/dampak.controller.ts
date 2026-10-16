import { Controller, Get } from '@nestjs/common';
import { DampakService } from './dampak.service';

@Controller('dampak')
export class DampakController {
    constructor(private dampakService: DampakService) { }

    @Get('ringkasan')
    getRingkasan() {
        return this.dampakService.getRingkasan();
    }
}
