"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const quiz_randomizer_1 = require("../src/wasiat/quiz-randomizer");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.$transaction(async (transaction) => {
        const steps = await transaction.wasiatLangkah.findMany({
            where: { jawabanDiacak: false },
            select: { id: true, kuis: true },
        });
        const counts = [0, 0, 0];
        for (const step of steps) {
            if (!Array.isArray(step.kuis))
                throw new Error(`Kuis quest ${step.id} bukan daftar soal`);
            const questions = step.kuis;
            const shuffled = (0, quiz_randomizer_1.acakKuis)(questions);
            shuffled.forEach((question) => { counts[question.jawabanBenar] += 1; });
            await transaction.wasiatLangkah.update({
                where: { id: step.id },
                data: { kuis: shuffled, jawabanDiacak: true },
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
//# sourceMappingURL=acak-jawaban.js.map