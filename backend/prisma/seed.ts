import { PrismaClient, Role, WasiatKategori } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminKontak = '081234567890';
  const existing = await prisma.user.findUnique({ where: { kontak: adminKontak } });

  const admin = existing ?? await prisma.user.create({
    data: {
      nama: 'Admin Guyub Ngapak',
      kontak: adminKontak,
      passwordHash: await bcrypt.hash('AdminGuyub123', 12),
      role: Role.ADMIN,
      kontakVerified: true,
      dusun: 'Purbalingga',
    },
  });

  async function ensureWasiat(title: string, kategori: WasiatKategori, isi: string, poinKiat: string[]) {
    const existingWasiat = await prisma.wasiat.findFirst({ where: { judul: title } });
    return existingWasiat ?? prisma.wasiat.create({
      data: { judul: title, kategori, isi, poinKiat, penulisId: admin.id },
    });
  }

  async function seedQuestPath(wasiatId: string, quests: Array<{ judul: string; tujuan: string; kuis: object[] }>) {
    for (const [index, quest] of quests.entries()) {
      await prisma.wasiatLangkah.upsert({
        where: { wasiatId_urutan: { wasiatId, urutan: index + 1 } },
        create: { wasiatId, urutan: index + 1, ...quest, kuis: quest.kuis as any },
        update: { judul: quest.judul, tujuan: quest.tujuan, kuis: quest.kuis as any },
      });
    }
  }

  const compost = await ensureWasiat(
    'Membuat Kompos dari Sampah Dapur',
    WasiatKategori.PERTANIAN,
    'Sampah dapur bisa jadi sumber pupuk yang bermanfaat untuk halaman rumah. Prosesnya sederhana, murah, dan mendidik generasi muda untuk menjaga lingkungan.',
    ['Pisahkan sampah organik dari plastik dan logam.', 'Cacah bahan organik agar proses pembusukan lebih cepat.', 'Campur dengan tanah dan aduk secara rutin.', 'Gunakan kompos setelah berwarna gelap dan bertekstur halus.'],
  );
  await seedQuestPath(compost.id, [
    {
      judul: 'Pilih dan siapkan bahan',
      tujuan: 'Kompos dibuat dari sisa bahan organik seperti kulit sayur, daun, dan ampas buah. Pisahkan plastik, logam, kaca, serta bahan berminyak agar kompos tetap aman dan mudah terurai.',
      kuis: [
        { pertanyaan: 'Bahan yang cocok untuk kompos adalah...', opsi: ['Kulit sayur', 'Plastik', 'Kaca'], jawabanBenar: 0 },
        { pertanyaan: 'Bahan berikut yang harus dipisahkan adalah...', opsi: ['Daun kering', 'Ampas buah', 'Logam'], jawabanBenar: 2 },
        { pertanyaan: 'Mengapa bahan organik dipilah?', opsi: ['Agar kompos aman dan mudah terurai', 'Agar warnanya cerah', 'Agar tidak perlu disiram'], jawabanBenar: 0 },
      ],
    },
    {
      judul: 'Racik dan rawat tumpukan',
      tujuan: 'Cacah bahan organik menjadi potongan kecil lalu campur dengan tanah atau bahan kering. Jaga kelembapan secukupnya dan aduk berkala supaya udara dapat masuk.',
      kuis: [
        { pertanyaan: 'Apa manfaat mencacah bahan?', opsi: ['Mempercepat penguraian', 'Membuat bahan membeku', 'Menghilangkan seluruh air'], jawabanBenar: 0 },
        { pertanyaan: 'Bagaimana kelembapan kompos dijaga?', opsi: ['Cukup lembap, tidak tergenang', 'Selalu terendam', 'Dibiarkan sangat kering'], jawabanBenar: 0 },
        { pertanyaan: 'Mengapa kompos perlu diaduk?', opsi: ['Memberi udara pada bahan', 'Mengubahnya menjadi plastik', 'Menghentikan penguraian'], jawabanBenar: 0 },
      ],
    },
    {
      judul: 'Panen kompos',
      tujuan: 'Kompos matang biasanya berwarna cokelat gelap, bertekstur remah, dan berbau seperti tanah. Gunakan secukupnya untuk menyuburkan tanaman dan teruskan kebiasaan mengolah sampah organik.',
      kuis: [
        { pertanyaan: 'Tanda kompos matang adalah...', opsi: ['Cokelat gelap dan remah', 'Masih terlihat plastik', 'Berbau menyengat'], jawabanBenar: 0 },
        { pertanyaan: 'Kompos matang dapat digunakan untuk...', opsi: ['Menyuburkan tanaman', 'Bahan bakar plastik', 'Mengganti air minum'], jawabanBenar: 0 },
        { pertanyaan: 'Apa kebiasaan baik setelah panen kompos?', opsi: ['Terus memilah sampah organik', 'Mencampur kembali plastik', 'Membuang semua sisa dapur'], jawabanBenar: 0 },
      ],
    },
  ]);

  const health = await ensureWasiat(
    'Kebiasaan Sehat untuk Keluarga',
    WasiatKategori.LITERASI_KESEHATAN,
    'Kebiasaan sederhana dapat membantu keluarga menjaga kesehatan sehari-hari. Kenali kebutuhan tubuh, jaga kebersihan, dan cari bantuan tenaga kesehatan saat diperlukan.',
    ['Biasakan cuci tangan dengan sabun.', 'Penuhi kebutuhan air dan istirahat.', 'Konsultasikan gejala yang mengkhawatirkan kepada tenaga kesehatan.'],
  );
  await seedQuestPath(health.id, [
    {
      judul: 'Perlindungan dari kuman',
      tujuan: 'Cuci tangan menggunakan sabun dan air mengalir sebelum makan serta setelah beraktivitas. Kebiasaan ini membantu mengurangi perpindahan kuman ke tubuh.',
      kuis: [
        { pertanyaan: 'Kapan sebaiknya mencuci tangan?', opsi: ['Sebelum makan', 'Hanya saat malam', 'Tidak perlu bila di rumah'], jawabanBenar: 0 },
        { pertanyaan: 'Apa yang digunakan untuk mencuci tangan?', opsi: ['Sabun dan air mengalir', 'Minyak goreng', 'Parfum saja'], jawabanBenar: 0 },
        { pertanyaan: 'Cuci tangan membantu mengurangi...', opsi: ['Perpindahan kuman', 'Kebutuhan tidur', 'Kadar oksigen'], jawabanBenar: 0 },
      ],
    },
    {
      judul: 'Rawat kebutuhan tubuh',
      tujuan: 'Tubuh memerlukan air minum yang cukup, makanan beragam, dan waktu istirahat. Kebutuhan tiap orang dapat berbeda, sehingga biasakan mengenali kondisi tubuh sendiri.',
      kuis: [
        { pertanyaan: 'Salah satu kebutuhan harian tubuh adalah...', opsi: ['Air minum yang cukup', 'Tidak tidur', 'Menghindari semua sayuran'], jawabanBenar: 0 },
        { pertanyaan: 'Mengapa istirahat diperlukan?', opsi: ['Mendukung pemulihan tubuh', 'Menggantikan semua makanan', 'Mencegah kebutuhan minum'], jawabanBenar: 0 },
        { pertanyaan: 'Kebutuhan tubuh setiap orang...', opsi: ['Dapat berbeda', 'Selalu sama persis', 'Tidak perlu diperhatikan'], jawabanBenar: 0 },
      ],
    },
    {
      judul: 'Quest Akhir: Bertindak saat perlu',
      tujuan: 'Perhatikan perubahan kondisi kesehatan diri dan keluarga. Bila gejala terasa berat, memburuk, atau mengkhawatirkan, mintalah pertolongan tenaga kesehatan dan jangan mengandalkan dugaan sendiri.',
      kuis: [
        { pertanyaan: 'Apa yang dilakukan jika gejala memburuk?', opsi: ['Meminta bantuan tenaga kesehatan', 'Mengabaikannya', 'Menghentikan minum air'], jawabanBenar: 0 },
        { pertanyaan: 'Mengapa tidak mengandalkan dugaan sendiri?', opsi: ['Tenaga kesehatan dapat membantu menilai kondisi', 'Semua gejala pasti ringan', 'Agar tidak perlu bercerita'], jawabanBenar: 0 },
        { pertanyaan: 'Kapan keluarga perlu mencari bantuan?', opsi: ['Saat gejala berat atau mengkhawatirkan', 'Hanya setelah satu tahun', 'Tidak pernah'], jawabanBenar: 0 },
      ],
    },
  ]);

  console.log('Seed admin dan contoh wasiat selesai.');
  console.log(`Kontak (HP): ${adminKontak}`);
  console.log('Password: AdminGuyub123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
