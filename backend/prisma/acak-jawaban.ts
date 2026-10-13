import { PrismaClient } from '@prisma/client';
import { acakKuis, QuizQuestionWithAnswer } from '../src/wasiat/quiz-randomizer';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$transaction(async (transaction) => {
        const steps = await transaction.wasiatLangkah.findMany({
            where: { jawabanDiacak: false },
            select: { id: true, kuis: true },
        });
        const counts = [0, 0, 0];

        for (const step of steps) {
            if (!Array.isArray(step.kuis)) throw new Error(`Kuis quest ${step.id} bukan daftar soal`);
            const questions = step.kuis as unknown as QuizQuestionWithAnswer[];
            const shuffled = acakKuis(questions);
            shuffled.forEach((question) => { counts[question.jawabanBenar] += 1; });
            await transaction.wasiatLangkah.update({
                where: { id: step.id },
                data: { kuis: shuffled as any, jawabanDiacak: true },
            });
        }

        return { jumlahQuest: steps.length, jumlahSoal: counts.reduce((sum, count) => sum + count, 0), counts };
    });

    console.log(`Quest diacak: ${result.jumlahQuest}`);
    console.log(`Soal diacak: ${result.jumlahSoal}`);
    console.log(`Posisi jawaban benar: A=${result.counts[0]}, B=${result.counts[1]}, C=${result.counts[2]}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
