export interface NewsItem {
  title: string;
  snippet: string;
  source: string;
  date: string;
  link: string;
}

export const MOCK_NEWS: NewsItem[] = [
  { title: 'Data contoh: kegiatan literasi di Purbalingga', snippet: 'Berita fiktif untuk menguji tampilan tab berita.', source: 'Sumber Contoh A', date: '2026-10-15', link: 'https://example.com/berita-1' },
  { title: 'Data contoh: perpustakaan komunitas di Banyumas', snippet: 'Konten contoh ini bukan berita nyata dan perlu diganti saat SerpAPI diaktifkan.', source: 'Sumber Contoh B', date: '2026-10-13', link: 'https://example.com/berita-2' },
  { title: 'Data contoh: ruang belajar warga di Banjarnegara', snippet: 'Data contoh hanya dipakai untuk menguji UI di mode pengembangan.', source: 'Sumber Contoh C', date: '2026-10-11', link: 'https://example.com/berita-3' },
  { title: 'Data contoh: kegiatan budaya di Cilacap', snippet: 'Tidak merujuk pada peristiwa atau lembaga tertentu.', source: 'Sumber Contoh D', date: '2026-10-09', link: 'https://example.com/berita-4' },
  { title: 'Data contoh: program pendidikan di Jawa Tengah', snippet: 'Contoh fiktif. Isi tidak boleh dianggap sebagai informasi faktual.', source: 'Sumber Contoh E', date: '2026-10-07', link: 'https://example.com/berita-5' },
  { title: 'Data contoh: layanan publik tingkat kabupaten', snippet: 'Tautan contoh menggunakan domain example.com.', source: 'Sumber Contoh F', date: '2026-10-05', link: 'https://example.com/berita-6' },
];