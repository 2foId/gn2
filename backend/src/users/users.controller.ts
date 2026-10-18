import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { OnboardingAgeDto } from './dto/onboarding-age.dto';
import { OnboardingBidangDto } from './dto/onboarding-bidang.dto';

const avatarExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me/level')
    getMineLevel(@CurrentUser('id') userId: string) {
        return this.usersService.getLevel(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/theme')
    updateTheme(@CurrentUser('id') userId: string, @Body() dto: UpdateThemeDto) {
        return this.usersService.updateTheme(userId, dto.theme);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMe(@CurrentUser('id') userId: string) {
        return this.usersService.findMyProfile(userId);
    }

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
    @Post('onboarding/age')
    saveOnboardingAge(@CurrentUser('id') userId: string, @Body() dto: OnboardingAgeDto) {
        return this.usersService.saveOnboardingAge(userId, dto.age);
    }

    @UseGuards(JwtAuthGuard)
    @Post('onboarding/bidang')
    saveOnboardingBidang(@CurrentUser('id') userId: string, @Body() dto: OnboardingBidangDto) {
        return this.usersService.saveOnboardingBidang(userId, dto.bidang);
    }

    @UseGuards(JwtAuthGuard)
    @Post('onboarding/selesai')
    completeOnboarding(@CurrentUser('id') userId: string) {
        return this.usersService.completeOnboarding(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
        }),
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            const extension = extname(file.originalname).toLowerCase();
            callback(null, avatarMimeTypes.has(file.mimetype) && avatarExtensions.has(extension));
        },
    }))
    uploadAvatar(@CurrentUser('id') userId: string, @UploadedFile() file: { filename: string } | undefined) {
        if (!file) throw new BadRequestException('Foto harus JPG, PNG, atau WEBP dan berukuran maksimal 2 MB.');
        return this.usersService.updateAvatar(userId, `/uploads/${file.filename}`);
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

    @Get(':id/ratings')
    findRatings(@Param('id') userId: string) {
        return this.usersService.findUserRatings(userId);
    }
}