import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import './globals.css';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Gestion de Granjas',
  description: 'Plataforma de gestion productiva para granjas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${nunitoSans.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
