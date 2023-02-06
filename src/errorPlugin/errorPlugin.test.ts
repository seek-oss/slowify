import { agentFromPlugins, mockRouteHandler } from '../testing/server';
import { errorPlugin, JsonResponse } from './errorPlugin';

describe('errorPlugin', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('exposes a thrown 4xx `JsonResponse` as JSON', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, 'bad');
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad' });
  });

  it('exposes additional fields in `JsonResponse` as JSON', async () => {
    mockRouteHandler.mockImplementation(async () => {
      throw new JsonResponse(400, 'bad', { extra: 'info' });
    });

    const agent = await agentFromPlugins(errorPlugin);
    await agent.get('/').expect(400, { message: 'bad', extra: 'info' });
  });
});
