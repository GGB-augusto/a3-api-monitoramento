import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monitoramento Sustentável',
  description: 'Indicadores e histórico de sustentabilidade da sua empresa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
