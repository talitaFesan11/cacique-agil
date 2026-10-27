import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export * from './enums/index.js';
export * from './schemas/common.js';
export * from './schemas/health.js';
export * from './types/index.js';
export { z };
