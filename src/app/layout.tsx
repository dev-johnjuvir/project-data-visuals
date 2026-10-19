import type { Metadata } from 'next';
import '@/styles/main.scss';

export const metadata: Metadata = {
  title: 'Pokédex Data Visuals',
  description: 'Learning data visualization with the PokeAPI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
