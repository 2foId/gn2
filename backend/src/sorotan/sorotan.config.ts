export const SOROTAN_CONFIG = {
  HARGA_PAKET: 1000,
  DURASI_HARI: 3,
  KUOTA_TAYANGAN_PER_HARI: 100,
  BATAS_IKLAN_AKTIF: 1,
  FREKUENSI_PER_USER_PER_IKLAN_PER_HARI: 2,
  JUDUL_MAX: 40,
  DESKRIPSI_MAX: 140,
} as const;

export type Bidang = 'Kesehatan' | 'Pendidikan' | 'Ekonomi' | 'Lingkungan' | 'Sosial' | 'Teknologi' | 'Budaya';

export const BIDANG_DAFTAR: Bidang[] = [
  'Kesehatan',
  'Pendidikan',
  'Ekonomi',
  'Lingkungan',
  'Sosial',
  'Teknologi',
  'Budaya',
];

export const KABUPATEN_DAFTAR = [
  'Cilacap', 'Banyumas', 'Purbalingga', 'Banjarnegara', 'Kebumen', 'Purworejo', 'Wonosobo', 'Magelang',
  'Boyolali', 'Klaten', 'Sukoharjo', 'Wonogiri', 'Karanganyar', 'Sragen', 'Grobogan', 'Blora', 'Rembang',
  'Pati', 'Kudus', 'Jepara', 'Demak', 'Semarang', 'Temanggung', 'Kendal', 'Batang', 'Pekalongan',
  'Pemalang', 'Tegal', 'Brebes', 'Kota Magelang', 'Kota Surakarta', 'Kota Salatiga', 'Kota Semarang',
  'Kota Pekalongan', 'Kota Tegal',
] as const;

export type Kabupaten = (typeof KABUPATEN_DAFTAR)[number];
