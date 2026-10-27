import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt-BR',
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));
