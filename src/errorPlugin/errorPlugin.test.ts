import { agentFromPlugins, mockRouteHandler } from '../testing/server';
import { create, JsonResponse } from './errorPlugin';

describe('errorPlugin', () => {
  const logger = {
    error: jest.fn(),
  };

  const errorPlugin = create(logger);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('exposes a thrown 4xx `JsonResponse` as JSON', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, { message: 'bad' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad' });
  });

  it('exposes additional fields in `JsonResponse` as JSON', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, { message: 'bad', extra: 'info' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad', extra: 'info' });
  });

  it('sends 500 and logs an error when a `JsonResponse` is not thrown', async () => {
    const unknownError = new Error('unknown');
    mockRouteHandler.mockImplementation(async () => {
      throw unknownError;
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(500, { message: 'Internal Server Error' });

    expect(logger.error).toBeCalledWith({ err: unknownError }, 'unknown error');
  });
});
