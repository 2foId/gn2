import { randomInt } from 'crypto';

export interface QuizQuestionWithAnswer {
    pertanyaan: string;
    opsi: string[];
    jawabanBenar: number;
}

export function acakKuis<T extends QuizQuestionWithAnswer>(kuis: T[]): T[] {
    return kuis.map((question) => {
        if (question.opsi.length !== 3 || !Number.isInteger(question.jawabanBenar) || question.jawabanBenar < 0 || question.jawabanBenar > 2) {
            throw new Error('Setiap soal harus memiliki tepat 3 opsi dan jawaban benar berindeks 0–2.');
        }
        const order = [0, 1, 2];
        for (let index = order.length - 1; index > 0; index -= 1) {
            const swapIndex = randomInt(index + 1);
            [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
        }
        return {
            ...question,
            opsi: order.map((originalIndex) => question.opsi[originalIndex]),
            jawabanBenar: order.indexOf(question.jawabanBenar),
        };
    });
}
