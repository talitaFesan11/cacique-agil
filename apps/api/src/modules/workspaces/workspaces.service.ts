import crypto from 'crypto';
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateWorkspaceInviteRequest,
  UpdateMemberRoleRequest,
  WorkspaceRole,
} from '@fluxo/shared';
import { env } from '../../config/env.js';
import { mailer } from '../../config/mailer.js';
import { createHttpError } from '../../middleware/auth.middleware.js';
import { workspacesRepository } from './workspaces.repository.js';

const generateSlugFromName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
};

export const workspacesService = {
  async listWorkspaces(userId: string) {
    const memberships = await workspacesRepository.listUserWorkspaces(userId);
    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role as WorkspaceRole,
      memberCount: m.workspace._count.memberships,
      projectCount: m.workspace._count.projects,
      createdAt: m.workspace.createdAt.toISOString(),
      updatedAt: m.workspace.updatedAt.toISOString(),
    }));
  },

  async createWorkspace(userId: string, input: CreateWorkspaceRequest) {
    let slug = input.slug || generateSlugFromName(input.name);
    if (!slug || slug.length < 2) {
      slug = `ws-${crypto.randomBytes(3).toString('hex')}`;
    }

    const existing = await workspacesRepository.findWorkspaceBySlug(slug);
    if (existing) {
      if (input.slug) {
        throw createHttpError(409, 'SLUG_ALREADY_EXISTS', 'Este identificador (slug) de workspace já está em uso');
      }
      slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
    }

    const workspace = await workspacesRepository.createWorkspaceWithOwner({
      name: input.name,
      slug,
      ownerId: userId,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: WorkspaceRole.OWNER,
      memberCount: 1,
      projectCount: 0,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  },

  async getWorkspace(workspaceId: string, userRole: WorkspaceRole) {
    const workspace = await workspacesRepository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw createHttpError(404, 'WORKSPACE_NOT_FOUND', 'Workspace não encontrado');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: userRole,
      memberCount: workspace._count.memberships,
      projectCount: workspace._count.projects,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  },

  async updateWorkspace(
    workspaceId: string,
    userRole: WorkspaceRole,
    input: UpdateWorkspaceRequest,
  ) {
    if (input.slug) {
      const existing = await workspacesRepository.findWorkspaceBySlug(input.slug);
      if (existing && existing.id !== workspaceId) {
        throw createHttpError(409, 'SLUG_ALREADY_EXISTS', 'Este identificador (slug) já está em uso');
      }
    }

    const updated = await workspacesRepository.updateWorkspace(workspaceId, {
      name: input.name,
      slug: input.slug,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      role: userRole,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async deleteWorkspace(workspaceId: string) {
    await workspacesRepository.deleteWorkspace(workspaceId);
    return { message: 'Workspace excluído com sucesso' };
  },

  async listMembers(workspaceId: string) {
    const members = await workspacesRepository.listMembers(workspaceId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      workspaceId: m.workspaceId,
      role: m.role as WorkspaceRole,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    }));
  },

  async updateMemberRole(params: {
    workspaceId: string;
    memberId: string;
    actorRole: WorkspaceRole;
    input: UpdateMemberRoleRequest;
  }) {
    const targetMember = await workspacesRepository.findMembershipById(
      params.memberId,
      params.workspaceId,
    );

    if (!targetMember) {
      throw createHttpError(404, 'MEMBER_NOT_FOUND', 'Membro não encontrado neste workspace');
    }

    const targetCurrentRole = targetMember.role as WorkspaceRole;

    // ADMIN não pode alterar OWNER nem promover a OWNER
    if (params.actorRole === WorkspaceRole.ADMIN) {
      if (
        targetCurrentRole === WorkspaceRole.OWNER ||
        params.input.role === WorkspaceRole.OWNER
      ) {
        throw createHttpError(
          403,
          'FORBIDDEN_OWNER_MODIFICATION',
          'Administradores não podem promover ou alterar proprietários (Owner)',
        );
      }
    }

    // Não permitir rebaixar o último OWNER do workspace
    if (
      targetCurrentRole === WorkspaceRole.OWNER &&
      params.input.role !== WorkspaceRole.OWNER
    ) {
      const ownersCount = await workspacesRepository.countOwners(params.workspaceId);
      if (ownersCount <= 1) {
        throw createHttpError(
          400,
          'LAST_OWNER_PROTECTED',
          'Não é possível rebaixar o único proprietário (Owner) do workspace',
        );
      }
    }

    const updated = await workspacesRepository.updateMemberRole(
      params.memberId,
      params.input.role,
    );

    return {
      id: updated.id,
      userId: updated.userId,
      workspaceId: updated.workspaceId,
      role: updated.role as WorkspaceRole,
      createdAt: updated.createdAt.toISOString(),
      user: updated.user,
    };
  },

  async removeMember(params: {
    workspaceId: string;
    memberId: string;
    actorRole: WorkspaceRole;
  }) {
    const targetMember = await workspacesRepository.findMembershipById(
      params.memberId,
      params.workspaceId,
    );

    if (!targetMember) {
      throw createHttpError(404, 'MEMBER_NOT_FOUND', 'Membro não encontrado neste workspace');
    }

    const targetCurrentRole = targetMember.role as WorkspaceRole;

    if (params.actorRole === WorkspaceRole.ADMIN && targetCurrentRole === WorkspaceRole.OWNER) {
      throw createHttpError(
        403,
        'FORBIDDEN_OWNER_MODIFICATION',
        'Administradores não podem remover proprietários (Owner)',
      );
    }

    if (targetCurrentRole === WorkspaceRole.OWNER) {
      const ownersCount = await workspacesRepository.countOwners(params.workspaceId);
      if (ownersCount <= 1) {
        throw createHttpError(
          400,
          'LAST_OWNER_PROTECTED',
          'Não é possível remover o único proprietário (Owner) do workspace',
        );
      }
    }

    await workspacesRepository.deleteMember(params.memberId);
    return { message: 'Membro removido do workspace com sucesso' };
  },

  async createInvite(params: {
    workspaceId: string;
    actorId: string;
    actorRole: WorkspaceRole;
    input: CreateWorkspaceInviteRequest;
  }) {
    if (
      params.actorRole === WorkspaceRole.ADMIN &&
      params.input.role === WorkspaceRole.OWNER
    ) {
      throw createHttpError(
        403,
        'FORBIDDEN_OWNER_INVITE',
        'Apenas proprietários (Owner) podem convidar novos proprietários',
      );
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const invite = await workspacesRepository.createInvite({
      workspaceId: params.workspaceId,
      email: params.input.email.toLowerCase(),
      role: params.input.role,
      token,
      invitedById: params.actorId,
      expiresAt,
    });

    const inviteUrl = `${env.WEB_URL}/pt-BR/invites/${invite.token}`;

    await mailer.sendMail({
      to: invite.email,
      subject: `Convite para participar do workspace ${invite.workspace.name} no Cacique Agil`,
      text: `Você foi convidado por ${invite.invitedBy.name} para entrar no workspace "${invite.workspace.name}" com o papel ${invite.role}. Acesse: ${inviteUrl}`,
      html: `<p>Olá,</p><p><strong>${invite.invitedBy.name}</strong> convidou você para colaborar no workspace <strong>${invite.workspace.name}</strong> no Cacique Agil com o papel <code>${invite.role}</code>.</p><p><a href="${inviteUrl}">Aceitar Convite</a></p>`,
    });

    return {
      id: invite.id,
      workspaceId: invite.workspaceId,
      email: invite.email,
      role: invite.role as WorkspaceRole,
      token: invite.token,
      invitedById: invite.invitedById,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
      createdAt: invite.createdAt.toISOString(),
      workspace: invite.workspace,
      invitedBy: invite.invitedBy,
    };
  },

  async listInvites(workspaceId: string) {
    const invites = await workspacesRepository.listInvites(workspaceId);
    return invites.map((inv) => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      email: inv.email,
      role: inv.role as WorkspaceRole,
      token: inv.token,
      invitedById: inv.invitedById,
      expiresAt: inv.expiresAt.toISOString(),
      acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
      invitedBy: inv.invitedBy,
    }));
  },

  async getInviteByToken(token: string) {
    const invite = await workspacesRepository.findInviteByToken(token);
    if (!invite || invite.revokedAt) {
      throw createHttpError(404, 'INVITE_NOT_FOUND', 'Convite não encontrado ou revogado');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw createHttpError(400, 'INVITE_EXPIRED', 'Este convite expirou');
    }

    return {
      id: invite.id,
      workspaceId: invite.workspaceId,
      email: invite.email,
      role: invite.role as WorkspaceRole,
      token: invite.token,
      invitedById: invite.invitedById,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
      createdAt: invite.createdAt.toISOString(),
      workspace: invite.workspace,
      invitedBy: invite.invitedBy,
    };
  },

  async acceptInvite(token: string, user: { id: string; email: string }) {
    const invite = await workspacesRepository.findInviteByToken(token);
    if (!invite || invite.revokedAt) {
      throw createHttpError(404, 'INVITE_NOT_FOUND', 'Convite não encontrado ou revogado');
    }

    if (invite.acceptedAt) {
      throw createHttpError(400, 'INVITE_ALREADY_ACCEPTED', 'Este convite já foi utilizado');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw createHttpError(400, 'INVITE_EXPIRED', 'Este convite expirou');
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw createHttpError(
        403,
        'INVITE_EMAIL_MISMATCH',
        'Este convite foi enviado para outro endereço de e-mail',
      );
    }

    await workspacesRepository.acceptInviteTransaction({
      inviteId: invite.id,
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role as WorkspaceRole,
    });

    return {
      message: 'Convite aceito com sucesso',
      workspace: invite.workspace,
      role: invite.role as WorkspaceRole,
    };
  },
};
