import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mercado Amigo - Fechamento do Caixa',
  description:
    'Gestão financeira simplificada para seu mercadinho. Feche o caixa de forma rápida e tranquila.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR'>
      <body
        className={`${plusJakartaSans.variable} font-[family-name:var(--font-plus-jakarta)]`}
      >
        {children}
      </body>
    </html>
  );
}
