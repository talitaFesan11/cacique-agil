import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';
import { mailer } from '../src/config/mailer.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Auth Endpoints (Fase 1)', () => {
  const app = createApp();

  beforeEach(() => {
    testDb.reset();
    vi.restoreAllMocks();
  });

  it('POST /api/v1/auth/register cadastra usuário, cria workspace padrão e retorna accessToken + cookie httpOnly', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Talita Dev',
      email: 'talita@fluxopro.local',
      password: 'Password@123',
      locale: 'pt-BR',
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('talita@fluxopro.local');
    expect(res.body.user.name).toBe('Talita Dev');
    expect(res.body.workspaces).toHaveLength(1);
    expect(res.body.workspaces[0].role).toBe('OWNER');

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('fluxopro_refresh_token=') && c.includes('HttpOnly'))).toBe(
      true,
    );
  });

  it('POST /api/v1/auth/register rejeita e-mail duplicado com 409', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Usuário 1',
      email: 'duplicado@fluxopro.local',
      password: 'Password@123',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Usuário 2',
      email: 'duplicado@fluxopro.local',
      password: 'Password@123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('POST /api/v1/auth/login autentica com credenciais válidas e rejeita senha incorreta com 401', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Lucas Silva',
      email: 'lucas@fluxopro.local',
      password: 'Password@123',
    });

    const badRes = await request(app).post('/api/v1/auth/login').send({
      email: 'lucas@fluxopro.local',
      password: 'WrongPassword',
    });
    expect(badRes.status).toBe(401);
    expect(badRes.body.error.code).toBe('INVALID_CREDENTIALS');

    const okRes = await request(app).post('/api/v1/auth/login').send({
      email: 'lucas@fluxopro.local',
      password: 'Password@123',
    });
    expect(okRes.status).toBe(200);
    expect(okRes.body.accessToken).toBeDefined();
    expect(okRes.body.user.email).toBe('lucas@fluxopro.local');
  });

  it('POST /api/v1/auth/refresh rotaciona o refresh token e bloqueia reutilização de token antigo (reuse detection)', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Ana Ro',
      email: 'ana@fluxopro.local',
      password: 'Password@123',
    });

    const firstCookies = regRes.headers['set-cookie'] as unknown as string[];
    expect(firstCookies).toBeDefined();

    // 1ª rotação legítima
    const refreshRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstCookies);

    expect(refreshRes1.status).toBe(200);
    expect(refreshRes1.body.accessToken).toBeDefined();
    const secondCookies = refreshRes1.headers['set-cookie'] as unknown as string[];

    // Reutilização do primeiro cookie (já rotacionado) deve falhar com 401 e revogar toda a família de sessões
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstCookies);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    // E agora até mesmo o segundo cookie foi revogado preventivamente
    const afterRevokeRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', secondCookies);

    expect(afterRevokeRes.status).toBe(401);
  });

  it('GET /api/v1/auth/me retorna perfil e workspaces quando autenticado e 401 sem token', async () => {
    const unauth = await request(app).get('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Carla Dias',
      email: 'carla@fluxopro.local',
      password: 'Password@123',
    });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${regRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('carla@fluxopro.local');
    expect(meRes.body.workspaces).toHaveLength(1);
  });

  it('Fluxo completo de recuperação de senha (forgot-password -> reset-password -> login com nova senha)', async () => {
    let capturedEmailHtml = '';
    vi.spyOn(mailer, 'sendMail').mockImplementation(async (opts) => {
      capturedEmailHtml = opts.html;
    });

    await request(app).post('/api/v1/auth/register').send({
      name: 'Pedro Alves',
      email: 'pedro@fluxopro.local',
      password: 'OldPassword@123',
    });

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'pedro@fluxopro.local',
    });
    expect(forgotRes.status).toBe(200);
    expect(capturedEmailHtml).toContain('reset-password?token=');

    const match = capturedEmailHtml.match(/token=([a-f0-9]+)/);
    expect(match).not.toBeNull();
    const resetToken = match![1];

    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token: resetToken,
      password: 'NewPassword@456',
    });
    expect(resetRes.status).toBe(200);

    // Login com senha antiga deve falhar
    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'pedro@fluxopro.local',
      password: 'OldPassword@123',
    });
    expect(oldLogin.status).toBe(401);

    // Login com nova senha deve funcionar
    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'pedro@fluxopro.local',
      password: 'NewPassword@456',
    });
    expect(newLogin.status).toBe(200);
  });
});
