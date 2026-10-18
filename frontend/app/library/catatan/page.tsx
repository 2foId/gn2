import { redirect } from 'next/navigation';

export default function LegacyLibraryNotesPage() {
  redirect('/pustaka?tab=catatan');
}