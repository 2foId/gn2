import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser('id') userId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.send(userId, dto.receiverId, dto.isi);
  }

  @Get('inbox')
  inbox(@CurrentUser('id') userId: string) {
    return this.messagesService.inbox(userId);
  }

  @Get('thread/:userId')
  thread(@CurrentUser('id') userId: string, @Param('userId') otherId: string) {
    return this.messagesService.thread(userId, otherId);
  }
}
