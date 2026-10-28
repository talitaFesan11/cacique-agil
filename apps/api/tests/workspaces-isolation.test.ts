import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { testDb } from './helpers/in-memory-db.js';
import { createApp } from '../src/app.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Workspaces, RBAC & Multi-Tenant Isolation (Fase 1 - Critério de Aceite)', () => {
  const app = createApp();

  beforeEach(() => {
    testDb.reset();
    vi.restoreAllMocks();
  });

  async function registerUser(name: string, email: string) {
    const res = await request(app).post('/api/v1/auth/register').send({
      name,
      email,
      password: 'Password@123',
    });
    return {
      accessToken: res.body.accessToken as string,
      user: res.body.user as { id: string; email: string; name: string },
      defaultWorkspace: res.body.workspaces[0].workspace as {
        id: string;
        name: string;
        slug: string;
      },
    };
  }

  it('ISOLAMENTO MULTI-TENANT: usuário do Workspace A nunca consegue ler nem escrever dados do Workspace B', async () => {
    const tenantA = await registerUser('Alice Tenant A', 'alice@tenanta.local');
    const tenantB = await registerUser('Bob Tenant B', 'bob@tenantb.local');

    // 1. Listagem de workspaces de Alice só retorna Workspace A
    const listRes = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tenantA.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(tenantA.defaultWorkspace.id);

    // 2. Alice tenta ler detalhes do Workspace B (por ID e por slug) -> 403 FORBIDDEN
    const getByIdRes = await request(app)
      .get(`/api/v1/workspaces/${tenantB.defaultWorkspace.id}`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`);
    expect(getByIdRes.status).toBe(403);
    expect(getByIdRes.body.error.code).toBe('FORBIDDEN_WORKSPACE_ACCESS');

    const getBySlugRes = await request(app)
      .get(`/api/v1/workspaces/${tenantB.defaultWorkspace.slug}`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`);
    expect(getBySlugRes.status).toBe(403);

    // 3. Alice tenta alterar nome do Workspace B -> 403 FORBIDDEN
    const patchRes = await request(app)
      .patch(`/api/v1/workspaces/${tenantB.defaultWorkspace.id}`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({ name: 'Invasão' });
    expect(patchRes.status).toBe(403);

    // 4. Alice tenta excluir Workspace B -> 403 FORBIDDEN
    const deleteRes = await request(app)
      .delete(`/api/v1/workspaces/${tenantB.defaultWorkspace.id}`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`);
    expect(deleteRes.status).toBe(403);

    // 5. Alice tenta listar membros do Workspace B -> 403 FORBIDDEN
    const membersRes = await request(app)
      .get(`/api/v1/workspaces/${tenantB.defaultWorkspace.id}/members`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`);
    expect(membersRes.status).toBe(403);

    // 6. Alice tenta enviar convites em nome do Workspace B -> 403 FORBIDDEN
    const inviteRes = await request(app)
      .post(`/api/v1/workspaces/${tenantB.defaultWorkspace.id}/invites`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .send({ email: 'intruso@tenanta.local', role: 'ADMIN' });
    expect(inviteRes.status).toBe(403);
  });

  it('CONVITES E RBAC: Owner convida Member e Guest, verifica permissões de cada papel e impede escalada de privilégio', async () => {
    const owner = await registerUser('Owner User', 'owner@org.local');
    const member = await registerUser('Member User', 'member@org.local');
    const outsider = await registerUser('Outsider User', 'outsider@org.local');

    const wsId = owner.defaultWorkspace.id;

    // 1. Owner cria convite para member@org.local com papel MEMBER
    const createInviteRes = await request(app)
      .post(`/api/v1/workspaces/${wsId}/invites`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@org.local', role: 'MEMBER' });

    expect(createInviteRes.status).toBe(201);
    const inviteToken = createInviteRes.body.token as string;
    expect(inviteToken).toBeDefined();

    // 2. Outsider tenta aceitar o convite enviado para member@org.local -> 403 INVITE_EMAIL_MISMATCH
    const wrongAcceptRes = await request(app)
      .post(`/api/v1/workspaces/invites/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(wrongAcceptRes.status).toBe(403);
    expect(wrongAcceptRes.body.error.code).toBe('INVITE_EMAIL_MISMATCH');

    // 3. Member aceita o convite legitimamente
    const acceptRes = await request(app)
      .post(`/api/v1/workspaces/invites/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.role).toBe('MEMBER');

    // 4. Member agora consegue visualizar o workspace e seus membros
    const memberGetWs = await request(app)
      .get(`/api/v1/workspaces/${wsId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(memberGetWs.status).toBe(200);
    expect(memberGetWs.body.role).toBe('MEMBER');

    // 5. Member NÃO consegue editar o workspace (requer OWNER ou ADMIN) -> 403 INSUFFICIENT_ROLE
    const memberPatchWs = await request(app)
      .patch(`/api/v1/workspaces/${wsId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Tentativa Member' });
    expect(memberPatchWs.status).toBe(403);
    expect(memberPatchWs.body.error.code).toBe('INSUFFICIENT_ROLE');

    // 6. Member NÃO consegue convidar novos membros -> 403 INSUFFICIENT_ROLE
    const memberInvite = await request(app)
      .post(`/api/v1/workspaces/${wsId}/invites`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ email: 'outro@org.local', role: 'GUEST' });
    expect(memberInvite.status).toBe(403);

    // 7. Owner promove Member para ADMIN
    const membersListRes = await request(app)
      .get(`/api/v1/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    const memberRecord = membersListRes.body.find(
      (m: { user: { email: string } }) => m.user.email === 'member@org.local',
    );
    const ownerRecord = membersListRes.body.find(
      (m: { user: { email: string } }) => m.user.email === 'owner@org.local',
    );

    const promoteRes = await request(app)
      .patch(`/api/v1/workspaces/${wsId}/members/${memberRecord.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ role: 'ADMIN' });
    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.role).toBe('ADMIN');

    // 8. Como ADMIN, agora pode editar o nome do workspace
    const adminPatchWs = await request(app)
      .patch(`/api/v1/workspaces/${wsId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Nome Atualizado pelo Admin' });
    expect(adminPatchWs.status).toBe(200);
    expect(adminPatchWs.body.name).toBe('Nome Atualizado pelo Admin');

    // 9. Porém, ADMIN NÃO pode alterar nem remover um OWNER -> 403 FORBIDDEN_OWNER_MODIFICATION
    const adminDemoteOwner = await request(app)
      .patch(`/api/v1/workspaces/${wsId}/members/${ownerRecord.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ role: 'MEMBER' });
    expect(adminDemoteOwner.status).toBe(403);
    expect(adminDemoteOwner.body.error.code).toBe('FORBIDDEN_OWNER_MODIFICATION');

    // 10. ADMIN NÃO pode excluir o workspace (apenas OWNER) -> 403 INSUFFICIENT_ROLE
    const adminDeleteWs = await request(app)
      .delete(`/api/v1/workspaces/${wsId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(adminDeleteWs.status).toBe(403);
    expect(adminDeleteWs.body.error.code).toBe('INSUFFICIENT_ROLE');

    // 11. Único OWNER não pode se rebaixar deixando o workspace órfão -> 400 LAST_OWNER_PROTECTED
    const ownerSelfDemote = await request(app)
      .patch(`/api/v1/workspaces/${wsId}/members/${ownerRecord.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ role: 'ADMIN' });
    expect(ownerSelfDemote.status).toBe(400);
    expect(ownerSelfDemote.body.error.code).toBe('LAST_OWNER_PROTECTED');
  });
});
