import { redirect } from 'next/navigation';

export default function LegacyLocalLibraryPage() {
  redirect('/pustaka?tab=jelajah');
}