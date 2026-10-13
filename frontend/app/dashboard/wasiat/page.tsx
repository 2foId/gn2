'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { UserIdentity } from '@/components/UserIdentity';

const KATEGORI = [
  { value: 'RESEP', label: 'Resep' },
  { value: 'KERAJINAN', label: 'Kerajinan' },
  { value: 'PERTANIAN', label: 'Pertanian' },
  { value: 'FILOSOFI', label: 'Filosofi' },
  { value: 'LITERASI_DIGITAL', label: 'Literasi Digital' },
  { value: 'LITERASI_KEUANGAN', label: 'Literasi Keuangan' },
  { value: 'LITERASI_KESEHATAN', label: 'Literasi Kesehatan' },
  { value: 'SEJARAH_BUDAYA', label: 'Sejarah & Budaya' },
  { value: 'BEBAS', label: 'Bebas' },
] as const;

function buatQuestline(tahapan: { judul: string; tujuan: string }[]) {
  return tahapan.map((tahap) => ({
    judul: tahap.judul,
    tujuan: tahap.tujuan,
    kuis: [
      { pertanyaan: `Apa fokus utama pada tahap "${tahap.judul}"?`, opsi: [tahap.tujuan.slice(0, 90), 'Mengabaikan proses dan keselamatan', 'Menghentikan kegiatan tanpa evaluasi'], jawabanBenar: 0 },
      { pertanyaan: 'Tindakan mana yang paling sesuai dengan tujuan tahap ini?', opsi: [tahap.tujuan.slice(0, 90), 'Memilih cara yang berlawanan dengan tujuan', 'Tidak memeriksa hasil pekerjaan'], jawabanBenar: 0 },
      { pertanyaan: `Setelah memahami tahap "${tahap.judul}", apa yang perlu dilakukan?`, opsi: ['Menerapkan langkah dengan cermat', 'Membuang semua hasil kerja', 'Mengulang tanpa memperhatikan tujuan'], jawabanBenar: 0 },
    ],
  }));
}

// 7 template siap pakai untuk mempercepat penulisan wasiat — mencakup semua
// kategori (Kuliner & Pertanian masing-masing dapat 2 varian karena paling
// umum ditulis warga). Konten bebas diedit user setelah template dipilih.
const TEMPLATES: {
  label: string;
  kategori: (typeof KATEGORI)[number]['value'];
  judul: string;
  isi: string;
  poinKiat: string;
  jumlahQuest: number;
  quest: ReturnType<typeof buatQuestline>;
}[] = [
    {
      label: 'Resep Mendoan',
      kategori: 'RESEP',
      judul: 'Resep Mendoan Renyah Khas Purbalingga',
      isi: 'Mendoan yang enak itu tepungnya harus encer dan digoreng setengah matang, bukan sampai kering seperti tempe goreng biasa. Rahasianya ada di bumbu dan suhu minyak yang pas.',
      poinKiat: 'Iris tempe tipis memanjang\nCampur tepung terigu dengan sedikit tepung beras agar renyah\nBumbui dengan bawang putih, ketumbar, dan daun bawang\nGoreng di minyak panas sedang, jangan sampai kering',
      jumlahQuest: 3,
      quest: buatQuestline([
        { judul: 'Siapkan tempe dan bumbu', tujuan: 'Pilih tempe segar dan iris tipis memanjang. Racik bawang putih, ketumbar, daun bawang, dan adonan tepung secukupnya.' },
        { judul: 'Buat adonan mendoan', tujuan: 'Campur tepung terigu dengan sedikit tepung beras dan air hingga encer. Balut tempe tipis-tipis agar rasa tempe tetap terasa.' },
        { judul: 'Goreng setengah matang', tujuan: 'Goreng dalam minyak panas sedang dan angkat saat bagian luar matang tetapi tempe masih lembut. Sajikan selagi hangat.' },
      ]),
    },
    {
      label: 'Sambal Ndeso',
      kategori: 'RESEP',
      judul: 'Sambal Ndeso Pedas Menggugah Selera',
      isi: 'Sambal ini biasa jadi teman makan mendoan atau sego megono. Kuncinya di kesegaran cabai rawit dan tomat yang dipetik langsung dari pekarangan.',
      poinKiat: 'Gunakan cabai rawit segar, jangan yang sudah layu\nUlek kasar, jangan terlalu halus\nTambahkan terasi bakar secukupnya\nPeras jeruk limau di akhir sebelum disajikan',
      jumlahQuest: 4,
      quest: buatQuestline([
        { judul: 'Pilih bahan segar', tujuan: 'Gunakan cabai rawit dan tomat yang segar. Siapkan bawang, terasi, garam, serta jeruk limau sesuai selera.' },
        { judul: 'Bakar terasi dan siapkan bumbu', tujuan: 'Bakar terasi sebentar sampai harum, lalu siapkan bahan lain dalam jumlah yang seimbang.' },
        { judul: 'Ulek sambal secara kasar', tujuan: 'Ulek cabai dan bumbu secukupnya tanpa membuat teksturnya terlalu halus. Cicipi sebelum menambah garam.' },
        { judul: 'Sajikan dengan jeruk limau', tujuan: 'Tambahkan perasan jeruk limau di akhir dan sajikan sambal segar sebagai pelengkap makanan.' },
      ]),
    },
    {
      label: 'Anyaman Bambu',
      kategori: 'KERAJINAN',
      judul: 'Anyaman Besek Bambu Warisan Keluarga',
      isi: 'Besek dari anyaman bambu ini biasa dipakai untuk wadah tempe atau oleh-oleh. Prosesnya butuh kesabaran tapi hasilnya awet bertahun-tahun kalau dirawat dengan benar.',
      poinKiat: 'Pilih bambu yang sudah cukup tua, minimal 3 tahun\nJemur bilah bambu sebelum dianyam agar tidak mudah berjamur\nAnyam dengan pola silang rapat supaya kuat\nLapisi dengan vernis alami agar lebih tahan lama',
      jumlahQuest: 5,
      quest: buatQuestline([
        { judul: 'Pilih bambu matang', tujuan: 'Pilih bambu yang cukup tua dan sehat agar bilahnya kuat serta tidak mudah rusak saat dibentuk.' },
        { judul: 'Belah dan rapikan bilah', tujuan: 'Belah bambu menjadi bilah dengan lebar seragam. Rapikan sisi tajam agar nyaman dan aman digunakan.' },
        { judul: 'Keringkan bahan', tujuan: 'Jemur bilah bambu hingga cukup kering sebelum dianyam agar hasilnya tidak mudah berjamur.' },
        { judul: 'Susun pola silang', tujuan: 'Mulai anyaman dari dasar dengan pola silang yang rapat dan jaga jarak bilah tetap teratur.' },
        { judul: 'Rapikan dan rawat besek', tujuan: 'Kunci ujung anyaman, rapikan sisa bilah, lalu simpan besek di tempat kering agar awet.' },
      ]),
    },
    {
      label: 'Tanam Cabai',
      kategori: 'PERTANIAN',
      judul: 'Tips Menanam Cabai di Lahan Sempit',
      isi: 'Tidak punya sawah luas bukan alasan untuk tidak bisa panen cabai sendiri. Dengan polybag dan perawatan yang telaten, pekarangan rumah pun bisa produktif.',
      poinKiat: 'Gunakan polybag ukuran minimal 30x30 cm\nCampur tanah dengan pupuk kandang matang\nSiram pagi dan sore, jangan sampai tergenang\nPangkas tunas air agar buah lebih lebat',
      jumlahQuest: 3,
      quest: buatQuestline([
        { judul: 'Siapkan media tanam', tujuan: 'Gunakan polybag berukuran cukup dan campur tanah dengan pupuk kandang yang sudah matang.' },
        { judul: 'Pindahkan bibit cabai', tujuan: 'Pilih bibit sehat dan pindahkan dengan hati-hati ke media tanam agar akar tidak rusak.' },
        { judul: 'Rawat hingga berbuah', tujuan: 'Siram secukupnya, pastikan air tidak menggenang, dan pangkas tunas air agar tanaman tumbuh baik.' },
      ]),
    },
    {
      label: 'Kompos Dapur',
      kategori: 'PERTANIAN',
      judul: 'Membuat Pupuk Kompos dari Sampah Dapur',
      isi: 'Daripada dibuang percuma, sisa sayur dan buah dari dapur bisa diolah jadi pupuk kompos yang menyuburkan tanaman sekaligus mengurangi sampah rumah tangga.',
      poinKiat: 'Pisahkan sampah organik dari plastik/kaca\nCacah sampah agar lebih cepat terurai\nCampur dengan tanah dan sedikit air, aduk rutin tiap 3 hari\nKompos siap pakai setelah 3-4 minggu, warnanya coklat gelap',
      jumlahQuest: 4,
      quest: buatQuestline([
        { judul: 'Pilah sampah dapur', tujuan: 'Pisahkan sisa sayur dan buah dari plastik, kaca, logam, dan bahan berminyak.' },
        { judul: 'Cacah bahan organik', tujuan: 'Potong bahan organik menjadi bagian kecil supaya proses penguraian berlangsung lebih cepat.' },
        { judul: 'Campur dan jaga kelembapan', tujuan: 'Campur bahan dengan tanah, jaga tetap lembap tanpa tergenang, dan aduk rutin agar udara masuk.' },
        { judul: 'Kenali kompos matang', tujuan: 'Setelah beberapa minggu, kompos matang berwarna cokelat gelap dan bertekstur remah sehingga siap digunakan.' },
      ]),
    },
    {
      label: 'Petuah Hidup',
      kategori: 'FILOSOFI',
      judul: 'Alon-Alon Waton Kelakon',
      isi: 'Petuah leluhur ini mengajarkan bahwa hidup tidak perlu tergesa-gesa, yang penting tujuan tercapai dengan selamat. Bukan berarti malas, tapi bekerja dengan penuh perhitungan dan kesabaran.',
      poinKiat: 'Utamakan ketelitian daripada kecepatan\nJangan tergesa mengambil keputusan besar\nNikmati proses, bukan cuma hasil akhir\nKesabaran akan berbuah hasil yang lebih matang',
      jumlahQuest: 5,
      quest: buatQuestline([
        { judul: 'Pahami makna petuah', tujuan: 'Alon-alon waton kelakon mengajarkan ketekunan dan kehati-hatian, bukan alasan untuk bermalas-malasan.' },
        { judul: 'Tentukan tujuan', tujuan: 'Tetapkan tujuan yang jelas sebelum bertindak agar tenaga dan waktu digunakan dengan terarah.' },
        { judul: 'Rencanakan langkah', tujuan: 'Bagi tujuan besar menjadi langkah kecil yang realistis dan pertimbangkan risiko setiap pilihan.' },
        { judul: 'Jalani dengan tekun', tujuan: 'Kerjakan rencana secara konsisten, teliti, dan sabar sambil memperbaiki cara bila diperlukan.' },
        { judul: 'Evaluasi hasil', tujuan: 'Periksa hasil perjalanan, ambil pelajaran, dan lanjutkan upaya hingga tujuan tercapai dengan baik.' },
      ]),
    },
    {
      label: 'Kiat Umum',
      kategori: 'BEBAS',
      judul: 'Kiat Hidup Sehari-hari ala Wong Ngapak',
      isi: 'Wasiat ini berisi hal-hal praktis yang mungkin tidak masuk kategori khusus, tapi tetap berguna untuk dibagikan ke sesama warga — dari kebiasaan baik sampai trik rumah tangga sederhana.',
      poinKiat: 'Tulis pengalaman pribadi yang benar-benar dipraktikkan\nGunakan bahasa sehari-hari agar mudah dipahami\nSertakan alasan kenapa kiat ini penting\nBoleh sertakan cerita singkat di baliknya',
      jumlahQuest: 3,
      quest: buatQuestline([
        { judul: 'Pilih pengalaman berguna', tujuan: 'Tentukan pengalaman sehari-hari yang benar-benar pernah dilakukan dan bermanfaat bagi orang lain.' },
        { judul: 'Susun kiat dengan jelas', tujuan: 'Tulis langkah secara runtut menggunakan bahasa sederhana, lalu jelaskan alasan kiat tersebut berguna.' },
        { judul: 'Bagikan dan periksa ulang', tujuan: 'Baca kembali tulisan agar mudah dipahami dan pastikan saran yang dibagikan aman untuk dipraktikkan.' },
      ]),
    },
  ];

interface WasiatItem {
  id: string;
  judul: string;
  kategori: string;
  isi: string;
  penulis: { id: string; nama: string; avatarUrl?: string | null };
  _count?: { saved: number; comments: number; langkah: number };
  rating: number | null;
  jumlahRater: number;
  foto: string[];
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');

export default function WasiatPage() {
  const [items, setItems] = useState<WasiatItem[]>([]);
  const [passedByWasiat, setPassedByWasiat] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ judul: '', kategori: 'RESEP', isi: '', poinKiat: '' });
  const [quests, setQuests] = useState<(typeof TEMPLATES)[number]['quest']>([]);
  const [foto, setFoto] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, progressRes] = await Promise.all([
        api.get('/wasiat', { params: filter ? { kategori: filter } : {} }),
        api.get('/wasiat/saya/progress').catch(() => ({ data: { progress: [] } })),
      ]);
      setItems(res.data);
      const passed: Record<string, number> = {};
      for (const item of progressRes.data.progress ?? []) {
        if (item.lulus) passed[item.wasiatId] = (passed[item.wasiatId] ?? 0) + 1;
      }
      setPassedByWasiat(passed);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleUseTemplate(template: (typeof TEMPLATES)[number]) {
    setForm({
      judul: template.judul,
      kategori: template.kategori,
      isi: template.isi,
      poinKiat: template.poinKiat,
    });
    setQuests(template.quest.map((quest) => ({ ...quest, kuis: quest.kuis.map((question) => ({ ...question, opsi: [...question.opsi] })) })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const uploadedPhotos = await Promise.all(foto.map(async (file) => {
        const data = new FormData();
        data.append('file', file);
        const response = await api.post('/uploads/image', data);
        return response.data.url;
      }));
      await api.post('/wasiat', {
        judul: form.judul,
        kategori: form.kategori,
        isi: form.isi,
        poinKiat: form.poinKiat.split('\n').map((s) => s.trim()).filter(Boolean),
        foto: uploadedPhotos,
        ...(quests.length ? { quest: quests } : {}),
      });
      setShowForm(false);
      setForm({ judul: '', kategori: 'RESEP', isi: '', poinKiat: '' });
      setQuests([]);
      setFoto([]);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message);
    }
  }

  async function handleSave(id: string) {
    await api.post(`/wasiat/${id}/simpan`);
    loadData();
  }

  function addQuest() {
    if (quests.length >= 5) return;
    setQuests((current) => [...current, {
      judul: '', tujuan: '', kuis: Array.from({ length: 3 }, () => ({ pertanyaan: '', opsi: ['', '', ''], jawabanBenar: 0 })),
    }]);
  }

  function updateQuestion(questIndex: number, questionIndex: number, update: (question: (typeof quests)[number]['kuis'][number]) => (typeof quests)[number]['kuis'][number]) {
    setQuests((current) => current.map((quest, index) => index !== questIndex ? quest : {
      ...quest,
      kuis: quest.kuis.map((question, qIndex) => qIndex === questionIndex ? update(question) : question),
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">Wasiat Ngapak</h1>
          <p className="font-body text-sm text-stone-600">
            Kearifan lokal dari warga senior — resep, kerajinan, pertanian, filosofi hidup.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-medium text-white hover:bg-guyub-bambu"
        >
          {showForm ? 'Batal' : '+ Tulis Wasiat'}
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('')}
          className={`shrink-0 rounded-full px-4 py-2 font-body text-sm ${!filter ? 'bg-guyub-bambuDark text-white' : 'bg-guyub-krem text-stone-700'}`}
        >
          Semua
        </button>
        {KATEGORI.map((k) => (
          <button
            key={k.value}
            onClick={() => setFilter(k.value)}
            className={`shrink-0 rounded-full px-4 py-2 font-body text-sm ${filter === k.value ? 'bg-guyub-bambuDark text-white' : 'bg-guyub-krem text-stone-700'}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-body text-sm font-medium text-stone-700">
              Mulai dari template (opsional)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleUseTemplate(t)}
                  className="rounded-full border border-guyub-bambu/30 bg-guyub-krem px-4 py-1.5 font-body text-xs font-medium text-guyub-bambuDark hover:bg-guyub-gula/30"
                >
                  {t.label} · {t.jumlahQuest} quest
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block font-body text-sm font-medium text-stone-700">Judul</label>
                <input
                  required
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-stone-700">Kategori</label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
                >
                  {KATEGORI.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Isi</label>
              <textarea
                required
                rows={4}
                value={form.isi}
                onChange={(e) => setForm({ ...form, isi: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Foto (maksimal 5 MB per foto)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.some((file) => file.size > 5 * 1024 * 1024)) {
                    setError('Setiap foto maksimal berukuran 5 MB.');
                    return;
                  }
                  setError(null);
                  setFoto(files);
                }}
                className="mt-1 block w-full font-body text-sm"
              />
            </div>
            {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">
                Poin Kiat (satu baris satu poin)
              </label>
              <textarea
                required
                rows={3}
                value={form.poinKiat}
                onChange={(e) => setForm({ ...form, poinKiat: e.target.value })}
                placeholder={'Contoh:\nGunakan air kelapa muda\nAduk searah jarum jam'}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <section className="space-y-4 rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><h2 className="font-display text-xl font-semibold text-guyub-bambuDark">Quest (opsional)</h2><p className="font-body text-xs text-stone-600">Jika ditambahkan, wasiat harus memiliki 1–5 quest.</p></div>
                <button type="button" onClick={addQuest} disabled={quests.length >= 5} className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm font-semibold text-white transition duration-200 hover:bg-guyub-bambu disabled:opacity-50">Tambah Quest</button>
              </div>
              {quests.map((quest, questIndex) => <fieldset key={questIndex} className="space-y-4 rounded-2xl border-2 border-yellow-400 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3"><legend className="font-display text-lg font-semibold text-guyub-bambuDark">Quest {questIndex + 1}{questIndex === quests.length - 1 ? ' · Quest Akhir' : ''}</legend><button type="button" onClick={() => setQuests((current) => current.filter((_, index) => index !== questIndex))} className="rounded-full px-3 py-1 font-body text-sm font-semibold text-guyub-merahBata hover:bg-guyub-krem">Hapus Quest</button></div>
                <label className="block font-body text-sm font-semibold text-stone-700">Judul<input value={quest.judul} maxLength={80} onChange={(event) => setQuests((current) => current.map((item, index) => index === questIndex ? { ...item, judul: event.target.value } : item))} required className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body font-normal" /></label>
                <label className="block font-body text-sm font-semibold text-stone-700">Tujuan<textarea value={quest.tujuan} maxLength={400} onChange={(event) => setQuests((current) => current.map((item, index) => index === questIndex ? { ...item, tujuan: event.target.value } : item))} required rows={3} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body font-normal" /></label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-body text-sm font-semibold text-stone-700">Soal ({quest.kuis.length}/10)</h3><button type="button" disabled={quest.kuis.length >= 10} onClick={() => setQuests((current) => current.map((item, index) => index === questIndex ? { ...item, kuis: [...item.kuis, { pertanyaan: '', opsi: ['', '', ''], jawabanBenar: 0 }] } : item))} className="rounded-full bg-guyub-krem px-3 py-1.5 font-body text-xs font-semibold text-guyub-bambuDark disabled:opacity-50">Tambah Soal</button></div>
                  {quest.kuis.map((question, questionIndex) => <div key={questionIndex} className="space-y-3 rounded-xl border border-stone-300 p-4">
                    <div className="flex items-center justify-between"><p className="font-body text-sm font-semibold text-guyub-bambuDark">Soal {questionIndex + 1}</p><button type="button" disabled={quest.kuis.length <= 3} onClick={() => setQuests((current) => current.map((item, index) => index === questIndex ? { ...item, kuis: item.kuis.filter((_, qIndex) => qIndex !== questionIndex) } : item))} className="font-body text-xs text-guyub-merahBata disabled:opacity-50">Hapus Soal</button></div>
                    <input value={question.pertanyaan} maxLength={200} required placeholder="Pertanyaan" onChange={(event) => updateQuestion(questIndex, questionIndex, (item) => ({ ...item, pertanyaan: event.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm" />
                    {question.opsi.map((option, optionIndex) => <label key={optionIndex} className="flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 font-body text-sm"><input type="radio" required checked={question.jawabanBenar === optionIndex} onChange={() => updateQuestion(questIndex, questionIndex, (item) => ({ ...item, jawabanBenar: optionIndex }))} name={`correct-${questIndex}-${questionIndex}`} className="h-4 w-4 accent-guyub-bambuDark" /><span className="w-6 font-bold text-guyub-tanah">{String.fromCharCode(65 + optionIndex)}.</span><input value={option} maxLength={120} required placeholder={`Opsi ${String.fromCharCode(65 + optionIndex)}`} onChange={(event) => updateQuestion(questIndex, questionIndex, (item) => ({ ...item, opsi: item.opsi.map((value, index) => index === optionIndex ? event.target.value : value) }))} className="min-w-0 flex-1 border-0 bg-transparent font-body text-sm outline-none" /></label>)}
                  </div>)}
                </div>
              </fieldset>)}
            </section>
            <button
              type="submit"
              className="rounded-full bg-guyub-gula px-6 py-2 font-body font-medium text-guyub-bambuDark hover:brightness-95"
            >
              Bagikan Wasiat
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="font-body text-sm text-stone-500">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="font-body text-sm text-stone-500">Belum ada wasiat di kategori ini.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
              <span className="rounded-full bg-guyub-krem px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark">
                {KATEGORI.find((category) => category.value === item.kategori)?.label ?? item.kategori}
              </span>
              <Link href={`/dashboard/wasiat/${item.id}`}>
                <h3 className="mt-1 font-display text-lg font-semibold text-guyub-bambuDark hover:underline">
                  {item.judul}
                </h3>
              </Link>
              <p className="mt-2 line-clamp-2 font-body text-sm text-stone-600">{item.isi}</p>
              <p className="mt-3 font-body text-sm font-medium text-guyub-bambuDark">
                {passedByWasiat[item.id] ?? 0} dari {item._count?.langkah ?? 0} quest lulus
              </p>
              {item.foto?.[0] && <img src={`${API_ORIGIN}${item.foto[0]}`} alt="" className="mt-3 h-40 w-full rounded-lg object-cover" />}
              <p className="mt-3 font-body text-sm text-amber-600">
                <span aria-hidden="true">★</span>{' '}{item.rating === null ? 'Belum ada rating' : `${item.rating.toFixed(1)} (${item.jumlahRater})`}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-body text-xs text-stone-500">oleh <UserIdentity user={item.penulis} size="sm" /></span>
                <button
                  onClick={() => handleSave(item.id)}
                  className="rounded-full bg-guyub-krem px-4 py-1 font-body text-xs font-medium text-guyub-bambuDark hover:bg-guyub-gula/30"
                >
                  Simpan ({item._count?.saved ?? 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}