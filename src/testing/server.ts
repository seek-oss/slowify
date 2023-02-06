import {
  fastify,
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginCallback,
  RouteHandler,
} from 'fastify';
import request from 'supertest';

/**
 * Create a new SuperTest agent from a Fastify application.
 */
export const agentFromApp = (app: FastifyInstance) => request.agent(app.server);

/**
 * Default route handler which mmocks the root get(`/`) handler.
 */
export const mockRouteHandler = jest.fn<
  ReturnType<RouteHandler>,
  Parameters<RouteHandler>
>();

const router: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get('/', mockRouteHandler);
};

const createApp = async (
  ...plugins: (FastifyPluginAsync | FastifyPluginCallback)[]
) => {
  const app = fastify();
  await Promise.all(plugins.map((plugin) => app.register(plugin)));
  await app.register(router);
  await app.ready();
  return app;
};

/**
 * Create a new SuperTest agent from a set of Fastify plugins.
 */
export const agentFromPlugins = async (
  ...plugins: (FastifyPluginAsync | FastifyPluginCallback)[]
) => {
  const app = await createApp(...plugins);

  return agentFromApp(app);
};