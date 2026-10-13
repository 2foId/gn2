import { PrismaClient, Role, WasiatKategori } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { hitungLevel, totalCurrencyUntukXp } from '../src/users/level';
import { acakKuis, QuizQuestionWithAnswer } from '../src/wasiat/quiz-randomizer';

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

  const existingUsers = await prisma.user.findMany({ select: { id: true, xpTotal: true } });
  for (const user of existingUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { level: hitungLevel(user.xpTotal).level, currency: totalCurrencyUntukXp(user.xpTotal) },
    });
  }

  async function ensureWasiat(title: string, kategori: WasiatKategori, isi: string, poinKiat: string[], isTemplate = false) {
    const existingWasiat = await prisma.wasiat.findFirst({ where: { judul: title } });
    if (existingWasiat) {
      return prisma.wasiat.update({ where: { id: existingWasiat.id }, data: { kategori, isi, poinKiat, isTemplate: isTemplate || existingWasiat.isTemplate } });
    }
    return prisma.wasiat.create({ data: { judul: title, kategori, isi, poinKiat, isTemplate, penulisId: admin.id } });
  }

  async function seedQuestPath(wasiatId: string, quests: Array<{ judul: string; tujuan: string; kuis: object[] }>) {
    if (quests.length < 3 || quests.length > 5) throw new Error('Questline template harus memiliki 3 sampai 5 quest');
    for (const [index, quest] of quests.entries()) {
      if (quest.kuis.length < 3 || quest.kuis.length > 10) throw new Error(`Kuis quest ${index + 1} harus memiliki 3 sampai 10 soal`);
      if (quest.kuis.some((question) => !Array.isArray((question as { opsi?: unknown }).opsi) || ((question as { opsi: unknown[] }).opsi.length !== 3))) {
        throw new Error(`Setiap soal quest ${index + 1} harus memiliki tepat 3 opsi`);
      }
      const existingStep = await prisma.wasiatLangkah.findUnique({ where: { wasiatId_urutan: { wasiatId, urutan: index + 1 } } });
      if (existingStep?.jawabanDiacak) {
        await prisma.wasiatLangkah.update({ where: { id: existingStep.id }, data: { judul: quest.judul, tujuan: quest.tujuan } });
        continue;
      }
      const shuffledQuiz = acakKuis(quest.kuis as QuizQuestionWithAnswer[]);
      if (existingStep) {
        await prisma.wasiatLangkah.update({ where: { id: existingStep.id }, data: { judul: quest.judul, tujuan: quest.tujuan, kuis: shuffledQuiz as any, jawabanDiacak: true } });
      } else {
        await prisma.wasiatLangkah.create({
          data: { wasiatId, urutan: index + 1, judul: quest.judul, tujuan: quest.tujuan, kuis: shuffledQuiz as any, jawabanDiacak: true },
        });
      }
    }
    await prisma.wasiatLangkah.deleteMany({ where: { wasiatId, urutan: { gt: quests.length } } });
  }

  function buatKuis(judul: string, tujuan: string) {
    return [
      { pertanyaan: `Apa fokus utama tahap "${judul}"?`, opsi: [tujuan.slice(0, 90), 'Mengabaikan proses dan keselamatan', 'Menghentikan kegiatan tanpa evaluasi'], jawabanBenar: 0 },
      { pertanyaan: 'Tindakan mana yang sesuai dengan tujuan tahap ini?', opsi: [tujuan.slice(0, 90), 'Memilih cara yang berlawanan', 'Tidak memeriksa hasil'], jawabanBenar: 0 },
      { pertanyaan: `Setelah memahami "${judul}", apa yang dilakukan?`, opsi: ['Menerapkan langkah dengan cermat', 'Membuang semua hasil kerja', 'Mengulang tanpa tujuan'], jawabanBenar: 0 },
    ];
  }

  const templateSamples = [
    {
      label: 'Resep Mendoan', title: 'Resep Mendoan Renyah Khas Purbalingga', kategori: WasiatKategori.RESEP,
      isi: 'Mendoan yang enak itu tepungnya encer dan digoreng setengah matang. Rahasianya ada di bumbu dan suhu minyak yang pas.',
      poinKiat: ['Iris tempe tipis memanjang', 'Bumbui adonan dengan bawang putih dan ketumbar', 'Goreng dengan minyak panas sedang'],
      stages: [
        ['Siapkan tempe dan bumbu', 'Pilih tempe segar dan iris tipis memanjang. Siapkan bawang putih, ketumbar, dan daun bawang.'],
        ['Buat adonan mendoan', 'Campur tepung terigu dengan sedikit tepung beras dan air hingga encer. Balut tempe tipis-tipis.'],
        ['Goreng setengah matang', 'Goreng dengan minyak panas sedang dan angkat saat bagian luar matang tetapi tempe masih lembut.'],
      ],
    },
    {
      label: 'Sambal Ndeso', title: 'Sambal Ndeso Pedas Menggugah Selera', kategori: WasiatKategori.RESEP,
      isi: 'Sambal segar cocok menjadi teman mendoan dan hidangan rumahan. Gunakan cabai dan tomat segar dari pekarangan.',
      poinKiat: ['Pilih cabai segar', 'Ulek kasar', 'Tambahkan jeruk limau di akhir'],
      stages: [
        ['Pilih bahan segar', 'Gunakan cabai rawit dan tomat segar, lalu siapkan bawang, terasi, garam, dan jeruk limau.'],
        ['Siapkan dan bakar bumbu', 'Bakar terasi sebentar hingga harum dan sesuaikan jumlah bumbu dengan selera keluarga.'],
        ['Ulek sambal secara kasar', 'Ulek cabai dan bumbu secukupnya tanpa membuat teksturnya terlalu halus.'],
        ['Sajikan sambal', 'Tambahkan perasan jeruk limau di akhir dan sajikan sambal segar sebagai pelengkap makanan.'],
      ],
    },
    {
      label: 'Anyaman Bambu', title: 'Anyaman Besek Bambu Warisan Keluarga', kategori: WasiatKategori.KERAJINAN,
      isi: 'Besek bambu dapat digunakan sebagai wadah yang kuat dan ramah lingkungan. Prosesnya memerlukan bahan matang dan ketelitian.',
      poinKiat: ['Pilih bambu tua', 'Jemur bilah sebelum dianyam', 'Gunakan pola silang rapat'],
      stages: [
        ['Pilih bambu matang', 'Pilih bambu yang cukup tua dan sehat agar bilah kuat serta tidak mudah rusak saat dibentuk.'],
        ['Belah dan rapikan bilah', 'Belah bambu menjadi bilah seragam dan rapikan sisi tajam agar aman digunakan.'],
        ['Keringkan bahan', 'Jemur bilah bambu sampai cukup kering supaya hasil anyaman tidak mudah berjamur.'],
        ['Susun pola silang', 'Mulai anyaman dari dasar dengan pola silang rapat dan jarak bilah teratur.'],
        ['Rapikan besek', 'Kunci ujung anyaman dan simpan besek di tempat kering agar lebih awet.'],
      ],
    },
    {
      label: 'Tanam Cabai', title: 'Tips Menanam Cabai di Lahan Sempit', kategori: WasiatKategori.PERTANIAN,
      isi: 'Pekarangan rumah dan polybag dapat menjadi tempat menanam cabai. Perawatan teratur membantu tanaman tumbuh sehat.',
      poinKiat: ['Gunakan polybag cukup besar', 'Campur tanah dengan pupuk matang', 'Siram tanpa membuat air menggenang'],
      stages: [
        ['Siapkan media tanam', 'Gunakan polybag berukuran cukup dan campurkan tanah dengan pupuk kandang matang.'],
        ['Pindahkan bibit cabai', 'Pilih bibit sehat dan pindahkan dengan hati-hati agar akar tidak rusak.'],
        ['Rawat tanaman', 'Siram secukupnya, hindari air menggenang, dan pangkas tunas air untuk mendukung pertumbuhan.'],
      ],
    },
    {
      label: 'Kompos Dapur', title: 'Membuat Pupuk Kompos dari Sampah Dapur', kategori: WasiatKategori.PERTANIAN,
      isi: 'Sisa sayur dan buah dapat diolah menjadi pupuk kompos yang menyuburkan tanaman dan mengurangi sampah rumah tangga.',
      poinKiat: ['Pilah sampah organik', 'Cacah bahan', 'Aduk kompos rutin'],
      stages: [
        ['Pilah sampah dapur', 'Pisahkan sisa sayur dan buah dari plastik, kaca, logam, dan bahan berminyak.'],
        ['Cacah bahan organik', 'Potong bahan organik menjadi bagian kecil supaya penguraian berlangsung lebih cepat.'],
        ['Campur dan jaga kelembapan', 'Campur bahan dengan tanah, jaga tetap lembap tanpa tergenang, dan aduk agar udara masuk.'],
        ['Kenali kompos matang', 'Kompos matang biasanya berwarna cokelat gelap dan bertekstur remah sehingga siap digunakan.'],
      ],
    },
    {
      label: 'Petuah Hidup', title: 'Alon-Alon Waton Kelakon', kategori: WasiatKategori.FILOSOFI,
      isi: 'Petuah ini mengajarkan bahwa tujuan dapat dicapai dengan tekun, sabar, dan penuh perhitungan, bukan dengan bermalas-malasan.',
      poinKiat: ['Utamakan ketelitian', 'Rencanakan keputusan', 'Nikmati proses'],
      stages: [
        ['Pahami makna petuah', 'Petuah ini mengajarkan ketekunan dan kehati-hatian, bukan alasan untuk bermalas-malasan.'],
        ['Tentukan tujuan', 'Tetapkan tujuan yang jelas supaya tenaga dan waktu digunakan secara terarah.'],
        ['Rencanakan langkah', 'Bagi tujuan besar menjadi langkah kecil yang realistis dan pertimbangkan risikonya.'],
        ['Jalani dengan tekun', 'Kerjakan rencana secara konsisten dan sabar sambil memperbaiki cara bila diperlukan.'],
        ['Evaluasi hasil', 'Ambil pelajaran dari hasil perjalanan dan lanjutkan upaya hingga tujuan tercapai.'],
      ],
    },
    {
      label: 'Kiat Umum', title: 'Kiat Hidup Sehari-hari ala Wong Ngapak', kategori: WasiatKategori.BEBAS,
      isi: 'Bagikan pengalaman praktis yang berguna bagi warga, dari kebiasaan baik hingga cara sederhana menyelesaikan pekerjaan rumah.',
      poinKiat: ['Bagikan pengalaman nyata', 'Gunakan bahasa sehari-hari', 'Jelaskan alasan kiat berguna'],
      stages: [
        ['Pilih pengalaman berguna', 'Tentukan pengalaman nyata yang pernah dilakukan dan bermanfaat bagi orang lain.'],
        ['Susun kiat dengan jelas', 'Tuliskan langkah secara runtut dengan bahasa sederhana dan alasan yang mudah dipahami.'],
        ['Bagikan dan periksa ulang', 'Pastikan tulisan jelas dan saran yang dibagikan aman untuk dipraktikkan.'],
      ],
    },
  ];

  for (const template of templateSamples) {
    const wasiat = await ensureWasiat(template.title, template.kategori, template.isi, template.poinKiat, true);
    await seedQuestPath(wasiat.id, template.stages.map(([judul, tujuan]) => ({ judul, tujuan, kuis: buatKuis(judul, tujuan) })));
  }
  const jumlahTemplateDenganQuest = await prisma.wasiat.count({
    where: { isTemplate: true, langkah: { some: {} } },
  });
  if (jumlahTemplateDenganQuest < 7) throw new Error('Tujuh template wasiat dengan questline belum berhasil dibuat');

  const templateSteps = await prisma.wasiatLangkah.findMany({ where: { wasiat: { isTemplate: true } }, select: { kuis: true } });
  const posisiBenar = [0, 0, 0];
  for (const step of templateSteps) {
    const questions = step.kuis as Array<{ opsi: string[]; jawabanBenar: number }>;
    for (const question of questions) {
      if (question.opsi.length !== 3 || !Number.isInteger(question.jawabanBenar) || question.jawabanBenar < 0 || question.jawabanBenar > 2) {
        throw new Error('Data template berisi kuis yang tidak memiliki tepat 3 opsi atau indeks benar yang sah');
      }
      posisiBenar[question.jawabanBenar] += 1;
    }
  }
  const totalSoalTemplate = posisiBenar.reduce((sum, count) => sum + count, 0);
  if (totalSoalTemplate > 0 && Math.max(...posisiBenar) > totalSoalTemplate / 2) {
    throw new Error(`Distribusi posisi jawaban template melewati 50%: A=${posisiBenar[0]}, B=${posisiBenar[1]}, C=${posisiBenar[2]}`);
  }
  console.log(`Template: ${jumlahTemplateDenganQuest} wasiat dengan questline.`);
  console.log(`Jawaban benar template: A=${posisiBenar[0]}, B=${posisiBenar[1]}, C=${posisiBenar[2]}`);

  const compost = await ensureWasiat(
    'Membuat Kompos dari Sampah Dapur',
    WasiatKategori.PERTANIAN,
    'Sampah dapur bisa jadi sumber pupuk yang bermanfaat untuk halaman rumah. Prosesnya sederhana, murah, dan mendidik generasi muda untuk menjaga lingkungan.',
    ['Pisahkan sampah organik dari plastik dan logam.', 'Cacah bahan organik agar proses pembusukan lebih cepat.', 'Campur dengan tanah dan aduk secara rutin.', 'Gunakan kompos setelah berwarna gelap dan bertekstur halus.'],
  );
  if (!compost.isTemplate) await seedQuestPath(compost.id, [
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
