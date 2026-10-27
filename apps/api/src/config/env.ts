import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Carrega .env do root ou local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('dev_jwt_secret_must_be_changed_in_prod_32chars_min'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default('dev_refresh_secret_must_be_changed_in_prod_32chars_min'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração de ambiente inválida:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
