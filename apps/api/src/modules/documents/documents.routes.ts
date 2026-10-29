import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { documentsController } from './documents.controller.js';
import { versionsController } from './versions.controller.js';
import { commentsController } from './comments.controller.js';

export const documentsRouter = Router();

// Todas as rotas exigem autenticação
documentsRouter.use(requireAuth);

// Workspace documents, tree & templates
documentsRouter.get(
  '/workspaces/:workspaceId/documents/tree',
  documentsController.getDocumentTree.bind(documentsController),
);
documentsRouter.get(
  '/workspaces/:workspaceId/documents/templates',
  documentsController.getTemplates.bind(documentsController),
);
documentsRouter.get(
  '/workspaces/:workspaceId/documents',
  documentsController.getDocuments.bind(documentsController),
);

// Documents CRUD
documentsRouter.post(
  '/documents',
  documentsController.createDocument.bind(documentsController),
);
documentsRouter.get(
  '/documents/:id',
  documentsController.getDocumentById.bind(documentsController),
);
documentsRouter.patch(
  '/documents/:id',
  documentsController.updateDocument.bind(documentsController),
);
documentsRouter.delete(
  '/documents/:id',
  documentsController.deleteDocument.bind(documentsController),
);

// Hierarchy, Favorites & Export
documentsRouter.post(
  '/documents/:id/move',
  documentsController.moveDocument.bind(documentsController),
);
documentsRouter.post(
  '/documents/:id/favorite',
  documentsController.toggleFavorite.bind(documentsController),
);
documentsRouter.get(
  '/documents/:id/export',
  documentsController.exportDocument.bind(documentsController),
);

// Versions history & restore
documentsRouter.get(
  '/documents/:id/versions',
  versionsController.getVersions.bind(versionsController),
);
documentsRouter.post(
  '/documents/:id/versions',
  versionsController.createVersion.bind(versionsController),
);
documentsRouter.post(
  '/documents/:id/versions/:versionId/restore',
  versionsController.restoreVersion.bind(versionsController),
);

// Comments inline
documentsRouter.get(
  '/documents/:id/comments',
  commentsController.getComments.bind(commentsController),
);
documentsRouter.post(
  '/documents/:id/comments',
  commentsController.createComment.bind(commentsController),
);
documentsRouter.patch(
  '/documents/comments/:commentId',
  commentsController.updateComment.bind(commentsController),
);
documentsRouter.delete(
  '/documents/comments/:commentId',
  commentsController.deleteComment.bind(commentsController),
);
