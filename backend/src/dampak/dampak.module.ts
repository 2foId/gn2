import { Module } from '@nestjs/common';
import { DampakController } from './dampak.controller';
import { DampakService } from './dampak.service';

@Module({
    controllers: [DampakController],
    providers: [DampakService],
})
export class DampakModule { }
