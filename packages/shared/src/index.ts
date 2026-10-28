import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export * from './enums/index.js';
export * from './schemas/common.js';
export * from './schemas/health.js';
export * from './schemas/auth.js';
export * from './schemas/workspace.js';
export * from './schemas/project.js';
export * from './schemas/task.js';
export * from './types/index.js';
export { z };
