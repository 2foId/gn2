import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, file.mimetype.startsWith('image/') && imageExtensions.has(extension));
    },
  }))
  uploadImage(@UploadedFile() file: { filename: string } | undefined) {
    if (!file) throw new BadRequestException('File gambar tidak valid. Gunakan JPG, PNG, WEBP, atau GIF maksimal 5 MB.');
    return { url: `/uploads/${file.filename}` };
  }
}