import {
  type FastifyInstance,
  type FastifyPluginAsync,
  type FastifyPluginCallback,
  type RouteHandler,
  fastify,
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

export const router: FastifyPluginAsync = async (app, _opts) => {
  app.get('/', mockRouteHandler);
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
