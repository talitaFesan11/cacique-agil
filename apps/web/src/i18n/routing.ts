import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pt-BR', 'en'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
