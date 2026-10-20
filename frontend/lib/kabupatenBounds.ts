export interface KabupatenBounds {
  center: [number, number];
  bounds: [[number, number], [number, number]];
}

// Batas luas Provinsi Jawa Tengah (seluruh pulau bagian Jawa Tengah).
export const JAWA_TENGAH_BOUNDS: [[number, number], [number, number]] = [
  [-8.35, 108.6], // sudut barat-daya
  [-6.55, 111.7], // sudut timur-laut
];

// Titik pusat per kabupaten/kota (koordinat kasar untuk penentuan pusat peta).
export const KABUPATEN_CENTER: Record<string, [number, number]> = {
  Cilacap: [-7.7303, 109.0136],
  Banyumas: [-7.6333, 109.2167],
  Purbalingga: [-7.3886, 109.3639],
  Banjarnegara: [-7.3537, 109.6353],
  Kebumen: [-7.6667, 109.6667],
  Purworejo: [-7.7111, 109.8583],
  Wonosobo: [-7.4333, 109.9],
  Magelang: [-7.4667, 110.2167],
  Boyolali: [-7.55, 110.5667],
  Klaten: [-7.6, 110.5833],
  Sukoharjo: [-7.6167, 110.8333],
  Wonogiri: [-7.7, 111.0167],
  Karanganyar: [-7.6, 110.9167],
  Sragen: [-7.4167, 111.0],
  Grobogan: [-7.1, 111.1667],
  Blora: [-6.9667, 111.4333],
  Rembang: [-6.7, 111.35],
  Pati: [-6.75, 111.0333],
  Kudus: [-6.8, 110.8333],
  Jepara: [-6.5833, 110.65],
  Demak: [-6.8833, 110.75],
  Semarang: [-6.9667, 110.4167],
  Temanggung: [-7.3167, 110.15],
  Kendal: [-6.9667, 110.1833],
  Batang: [-6.9, 109.7167],
  Pekalongan: [-6.8833, 109.6667],
  Pemalang: [-6.8917, 109.3833],
  Tegal: [-6.8667, 109.1333],
  Brebes: [-6.7167, 108.95],
  'Kota Magelang': [-7.4667, 110.2167],
  'Kota Surakarta': [-7.5667, 110.8333],
  'Kota Salatiga': [-7.3333, 110.5],
  'Kota Semarang': [-6.9667, 110.4167],
  'Kota Pekalongan': [-6.8833, 109.6667],
  'Kota Tegal': [-6.8667, 109.1333],
};

// Bounding box kasar per kabupaten/kota untuk membatasi navigasi peta saat memilih lokasi.
export const KABUPATEN_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  Cilacap: [[-7.9, 108.9], [-7.6, 109.2]],
  Banyumas: [[-7.8, 109.1], [-7.5, 109.4]],
  Purbalingga: [[-7.55, 109.25], [-7.25, 109.5]],
  Banjarnegara: [[-7.55, 109.5], [-7.2, 109.8]],
  Kebumen: [[-7.85, 109.5], [-7.5, 109.85]],
  Purworejo: [[-7.85, 109.75], [-7.6, 110.0]],
  Wonosobo: [[-7.55, 109.85], [-7.35, 110.05]],
  Magelang: [[-7.6, 110.1], [-7.35, 110.35]],
  Boyolali: [[-7.7, 110.45], [-7.4, 110.65]],
  Klaten: [[-7.7, 110.5], [-7.5, 110.65]],
  Sukoharjo: [[-7.7, 110.75], [-7.55, 110.9]],
  Wonogiri: [[-7.85, 110.9], [-7.55, 111.15]],
  Karanganyar: [[-7.7, 110.8], [-7.5, 110.95]],
  Sragen: [[-7.5, 110.9], [-7.35, 111.1]],
  Grobogan: [[-7.25, 111.0], [-7.0, 111.3]],
  Blora: [[-7.1, 111.3], [-6.85, 111.6]],
  Rembang: [[-6.85, 111.25], [-6.6, 111.45]],
  Pati: [[-6.85, 110.9], [-6.65, 111.15]],
  Kudus: [[-6.9, 110.75], [-6.75, 110.9]],
  Jepara: [[-6.65, 110.55], [-6.55, 110.75]],
  Demak: [[-6.95, 110.65], [-6.8, 110.85]],
  Semarang: [[-7.1, 110.3], [-6.85, 110.55]],
  Temanggung: [[-7.45, 110.05], [-7.2, 110.25]],
  Kendal: [[-7.1, 110.05], [-6.85, 110.3]],
  Batang: [[-7.0, 109.6], [-6.8, 109.85]],
  Pekalongan: [[-7.0, 109.55], [-6.8, 109.75]],
  Pemalang: [[-7.0, 109.25], [-6.8, 109.45]],
  Tegal: [[-7.0, 109.0], [-6.8, 109.25]],
  Brebes: [[-6.85, 108.8], [-6.6, 109.05]],
  'Kota Magelang': [[-7.5, 110.15], [-7.45, 110.28]],
  'Kota Surakarta': [[-7.6, 110.75], [-7.55, 110.9]],
  'Kota Salatiga': [[-7.35, 110.45], [-7.32, 110.55]],
  'Kota Semarang': [[-7.05, 110.35], [-6.9, 110.48]],
  'Kota Pekalongan': [[-6.95, 109.6], [-6.85, 109.7]],
  'Kota Tegal': [[-6.9, 109.05], [-6.85, 109.2]],
};
