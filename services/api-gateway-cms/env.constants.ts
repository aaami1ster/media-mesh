import * as dotenv from 'dotenv';

const env = process.env.NODE_ENV ?? 'development';

dotenv.config({ path: `.env.${env}` });

const variables = process.env;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json') as { version: string };

export const NODE_ENV = variables.NODE_ENV || 'development';
export const PORT = parseInt(variables.PORT ?? '3000', 10);


export const CORS_ORIGINS = variables.CORS_ORIGINS;

export const LOG_LEVELS = variables.LOG_LEVELS ? variables.LOG_LEVELS.split(',') : ['log', 'error', 'warn']; // ,'debug','verbose'];

export const APP_VERSION = packageJson.version || '0.0.0';

