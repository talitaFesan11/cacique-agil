import { Request, Response, NextFunction } from 'express';
import { CreateDocumentCommentRequestSchema, UpdateDocumentCommentRequestSchema } from '@fluxo/shared';
import { commentsService } from './comments.service.js';

export class CommentsController {
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docId = String(req.params.id);

      const comments = await commentsService.getComments(userId, docId);
      res.json({ data: comments });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docId = String(req.params.id);
      const validated = CreateDocumentCommentRequestSchema.parse(req.body);

      const comment = await commentsService.createComment(userId, docId, validated);
      res.status(201).json({ data: comment });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const commentId = String(req.params.commentId);
      const validated = UpdateDocumentCommentRequestSchema.parse(req.body);

      const comment = await commentsService.updateComment(userId, commentId, validated);
      res.json({ data: comment });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const commentId = String(req.params.commentId);

      await commentsService.deleteComment(userId, commentId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const commentsController = new CommentsController();
