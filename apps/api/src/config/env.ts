import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Carrega .env do root ou local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .default('postgresql://fluxo:fluxo@localhost:5432/fluxo?schema=public'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  WEB_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('dev_jwt_secret_must_be_changed_in_prod_32chars_min'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default('dev_refresh_secret_must_be_changed_in_prod_32chars_min'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(7),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('noreply@fluxopro.local'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração de ambiente inválida:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
