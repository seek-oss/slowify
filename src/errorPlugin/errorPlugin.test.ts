import fastify, { type FastifyBaseLogger } from 'fastify';

import {
  agentFromApp,
  agentFromPlugins,
  mockRouteHandler,
  router,
} from '../testing/server';

import { JsonResponse, plugin } from './errorPlugin';

describe('errorPlugin', () => {
  const errorPlugin = plugin;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('exposes a thrown 4xx `JsonResponse` as JSON', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, 'bad', { message: 'bad' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad' });
  });

  it('exposes an error like object with a statusCode', async () => {
    mockRouteHandler.mockImplementation(async () =>
      Promise.reject({ statusCode: 400, message: 'bad' }),
    );

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, 'bad');
  });

  it('redacts a thrown 5xx error', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(502, 'bad', { message: 'bad' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(502, '');
  });

  it('returns a JSON payload when by default', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, 'bad', { message: 'bad' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad' });
  });

  it('returns a plain text payload when accept is text/plain', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, 'bad', { message: 'bad' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').set('accept', 'plain/text').expect(400, 'bad');
  });

  it('redacts a non http error and logs the unknown error', async () => {
    const unknownError = new Error('bad');
    mockRouteHandler.mockImplementation(async () => {
      throw unknownError;
    });
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
      warn: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(() => mockLogger),
    } as Partial<FastifyBaseLogger> as FastifyBaseLogger;

    const app = fastify({
      logger: mockLogger,
    });
    await app.register(errorPlugin);
    await app.register(router);
    await app.ready();

    await agentFromApp(app).get('/').expect(500, '');
    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: unknownError },
      'unknown error',
    );
  });
});
