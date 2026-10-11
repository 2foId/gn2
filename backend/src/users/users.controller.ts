import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateNoteDto } from './dto/create-note.dto';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me/profile')
    findMine(@CurrentUser('id') userId: string) {
        return this.usersService.findMyProfile(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/profile')
    updateMine(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/notes')
    findNotes(@Param('id') targetUserId: string, @CurrentUser('id') authorId: string) {
        return this.usersService.findNotes(authorId, targetUserId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/notes')
    createNote(@Param('id') targetUserId: string, @CurrentUser('id') authorId: string, @Body() dto: CreateNoteDto) {
        return this.usersService.createNote(authorId, targetUserId, dto.isi);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/notes/:noteId')
    deleteNote(@Param('id') targetUserId: string, @Param('noteId') noteId: string, @CurrentUser('id') authorId: string) {
        return this.usersService.deleteNote(authorId, targetUserId, noteId);
    }

    @Get(':id')
    findPublic(@Param('id') id: string) {
        return this.usersService.findPublicProfile(id);
    }
}