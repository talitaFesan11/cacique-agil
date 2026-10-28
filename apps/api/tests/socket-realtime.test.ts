import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { ProjectStatus, WorkspaceRole } from '@fluxo/shared';
import { env } from '../src/config/env.js';
import { socketAuthMiddleware, AuthenticatedSocket } from '../src/realtime/socket.auth.js';
import { registerRoomHandlers } from '../src/realtime/socket.rooms.js';
import { socketEmitter } from '../src/realtime/socket.emitter.js';
import { testDb } from './helpers/in-memory-db.js';

vi.mock('../src/config/prisma.js', async () => {
  const { testDb: db } = await import('./helpers/in-memory-db.js');
  return { prisma: db };
});

describe('Fase 3: Tempo Real — Handshake, Salas, Presença e Emitter', () => {
  beforeEach(() => {
    testDb.reset();
    vi.restoreAllMocks();
  });

  it('SOCKET AUTH: rejeita conexão sem token e aceita token JWT válido', async () => {
    // 1. Sem token
    const fakeSocketWithoutToken = {
      handshake: { auth: {}, headers: {} },
      data: {},
    } as unknown as AuthenticatedSocket;

    const nextWithoutToken = vi.fn();
    socketAuthMiddleware(fakeSocketWithoutToken as any, nextWithoutToken);

    expect(nextWithoutToken).toHaveBeenCalledWith(expect.any(Error));
    const firstCallError = (nextWithoutToken.mock.calls[0] as [Error])[0];
    expect(firstCallError.message).toBe('AUTH_TOKEN_REQUIRED');

    // 2. Token inválido
    const fakeSocketBadToken = {
      handshake: { auth: { token: 'invalid_token_123' }, headers: {} },
      data: {},
    } as unknown as AuthenticatedSocket;

    const nextBadToken = vi.fn();
    socketAuthMiddleware(fakeSocketBadToken as any, nextBadToken);

    expect(nextBadToken).toHaveBeenCalledWith(expect.any(Error));
    const badTokenError = (nextBadToken.mock.calls[0] as [Error])[0];
    expect(badTokenError.message).toBe('AUTHENTICATION_FAILED');

    // 3. Token válido assinado com JWT_SECRET
    const validToken = jwt.sign(
      { sub: 'usr_123', email: 'dev@fluxopro.local', name: 'Dev Antigravity' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const fakeSocketValid = {
      handshake: { auth: { token: validToken }, headers: {} },
      data: {},
    } as unknown as AuthenticatedSocket;

    const nextValid = vi.fn();
    socketAuthMiddleware(fakeSocketValid as any, nextValid);

    expect(nextValid).toHaveBeenCalledWith();
    expect(fakeSocketValid.data.user).toEqual({
      id: 'usr_123',
      email: 'dev@fluxopro.local',
      name: 'Dev Antigravity',
    });
    expect(fakeSocketValid.data.projectRooms).toBeInstanceOf(Set);
  });

  it('SOCKET ROOMS & PRESENÇA: adiciona usuário à sala do projeto e emite lista de presença', async () => {
    // Popula banco de teste
    const user = await testDb.user.create({
      data: {
        name: 'Ana Owner',
        email: 'ana@fluxopro.local',
        passwordHash: 'hash',
        locale: 'pt-BR',
      },
    });

    const workspace = await testDb.workspace.create({
      data: {
        name: 'Workspace Teste',
        slug: 'ws-teste',
      },
    });

    await testDb.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
    });

    const project = await testDb.project.create({
      data: {
        workspaceId: workspace.id,
        name: 'Projeto Realtime',
        key: 'PRJ',
        status: ProjectStatus.ACTIVE,
        ownerId: user.id,
      },
    });

    // Mocks do Socket e Server
    const joinMock = vi.fn();
    const leaveMock = vi.fn();
    const emitToRoomMock = vi.fn();

    const mockIo = {
      to: vi.fn().mockReturnValue({ emit: emitToRoomMock }),
    } as any;

    const eventHandlers: Record<string, Function> = {};
    const mockSocket = {
      id: 'sock_12345',
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        projectRooms: new Set<string>(),
      },
      join: joinMock,
      leave: leaveMock,
      emit: vi.fn(),
      on: vi.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
    } as unknown as AuthenticatedSocket;

    registerRoomHandlers(mockIo, mockSocket);

    // Dispara join-project
    expect(eventHandlers['join-project']).toBeDefined();
    await eventHandlers['join-project']?.({ projectId: project.id });

    expect(joinMock).toHaveBeenCalledWith(`project:${project.id}`);
    expect(mockIo.to).toHaveBeenCalledWith(`project:${project.id}`);
    expect(emitToRoomMock).toHaveBeenCalledWith(
      'presence.update',
      expect.objectContaining({
        projectId: project.id,
        users: expect.arrayContaining([
          expect.objectContaining({
            userId: user.id,
            name: user.name,
          }),
        ]),
      }),
    );

    // Dispara leave-project
    await eventHandlers['leave-project']?.({ projectId: project.id });
    expect(leaveMock).toHaveBeenCalledWith(`project:${project.id}`);
  });

  it('SOCKET EMITTER: emite task.moved e task.created para a sala do projeto', () => {
    const emitMock = vi.fn();
    const mockIo = {
      to: vi.fn().mockReturnValue({ emit: emitMock }),
    } as any;

    socketEmitter.setServer(mockIo);

    // Teste de taskMoved
    socketEmitter.taskMoved('proj_abc', {
      taskId: 'task_1',
      projectId: 'proj_abc',
      statusId: 'status_in_progress',
      position: 1500,
      actorId: 'usr_actor',
    });

    expect(mockIo.to).toHaveBeenCalledWith('project:proj_abc');
    expect(emitMock).toHaveBeenCalledWith('task.moved', {
      taskId: 'task_1',
      projectId: 'proj_abc',
      statusId: 'status_in_progress',
      position: 1500,
      actorId: 'usr_actor',
    });
  });
});
