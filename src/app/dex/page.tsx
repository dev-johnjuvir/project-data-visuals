import { redirect } from 'next/navigation';

// Each region's Field Dex lives at its own URL; start with Region I.
export default function DexIndexPage() {
  redirect('/dex/1');
}
