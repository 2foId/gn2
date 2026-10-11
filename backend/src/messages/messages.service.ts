import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = { id: true, nama: true, avatarUrl: true } as const;

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(senderId: string, receiverId: string, isi: string) {
    if (senderId === receiverId) throw new BadRequestException('Tidak bisa mengirim pesan ke diri sendiri');
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('Penerima tidak ditemukan');
    return this.prisma.message.create({
      data: { senderId, receiverId, isi },
      include: { sender: { select: USER_SELECT }, receiver: { select: USER_SELECT } },
    });
  }

  async inbox(userId: string) {
    const received = await this.prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: USER_SELECT } },
    });
    const latestBySender = new Map<string, (typeof received)[number]>();
    for (const message of received) {
      if (!latestBySender.has(message.senderId)) latestBySender.set(message.senderId, message);
    }
    return Array.from(latestBySender.values()).map((message) => ({
      sender: message.sender,
      lastMessage: message.isi,
      preview: message.isi.length > 10 ? `${message.isi.slice(0, 10)}…` : message.isi,
      updatedAt: message.createdAt,
    }));
  }

  async thread(userId: string, otherId: string) {
    const other = await this.prisma.user.findUnique({ where: { id: otherId } });
    if (!other) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: USER_SELECT }, receiver: { select: USER_SELECT } },
    });
  }
}
