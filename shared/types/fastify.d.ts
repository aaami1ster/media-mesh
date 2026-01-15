import { RequestUser } from '../decorators/current-user.decorator';
import 'fastify';

/**
 * Extend FastifyRequest to include user property
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: RequestUser;
  }
}
