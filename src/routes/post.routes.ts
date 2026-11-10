import { Router } from 'express';
import { handlePublishPost } from '../controllers/post.controller';

export const postRouter = Router();

/**
 * Multi-Platform Post Generation & Publishing
 * Generates and formats posts for LinkedIn, Twitter (X), Instagram, and Facebook
 */
postRouter.post('/publish', handlePublishPost);

