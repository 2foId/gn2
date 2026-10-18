export const librarySources = {
  'Google Scholar': {
    url: 'https://scholar.google.com/scholar?q={q}',
  },
  'Open Library': {
    url: 'https://openlibrary.org/search?q={q}',
  },
  DOAJ: {
    // Pola URL ini perlu diverifikasi dan dapat diganti bila endpoint pencarian DOAJ berubah.
    url: 'https://doaj.org/search/articles?ref=homepage&q={q}',
  },
} as const;

export type LibrarySourceName = keyof typeof librarySources;