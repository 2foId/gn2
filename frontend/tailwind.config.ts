import type { Config } from 'tailwindcss';

// Palet terinspirasi kearifan lokal Purbalingga: hijau bambu, cokelat tanah,
// dan aksen kuning gula kelapa — bukan default ungu/biru template AI.
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        guyub: {
          bambu: '#3F6B4A',
          bambuDark: '#2A4A32',
          tanah: '#8B5E3C',
          gula: '#E0A639',
          krem: '#F7F2E9',
          merahBata: '#B4452C',
        },
      },
      fontFamily: {
        display: ['"Gentle Hearts"', 'cursive'],
        hero: ['"Gentle Hearts"', 'cursive'],
        body: ['"Helvetica Now Display Cn Med"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
