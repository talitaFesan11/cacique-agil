import React from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { MainLayout } from '@/components/layout/MainLayout';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'pt-BR' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
        <title>FluxoPro — Plataforma de Gerenciamento e Fluxo de Projetos</title>
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeRegistry>
            <MainLayout>{children}</MainLayout>
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
