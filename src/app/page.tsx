import { redirect } from 'next/navigation';

// Each generation lives at its own URL; start at the beginning.
export default function HomePage() {
  redirect('/generation/1');
}
