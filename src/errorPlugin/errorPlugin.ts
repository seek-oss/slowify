import { fastifyAccepts } from '@fastify/accepts';
import type { FastifyPluginAsync } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    [ERROR_STATE_KEY]?: unknown;
  }
}

export const ERROR_STATE_KEY = Symbol('seek-slowify-error');

const isObject = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Custom error type supporting JSON response bodies
 *
 * The `handle` middleware will return either `message` or `body` depending on
 * the request's `Accept` header.
 */
export class JsonResponse extends Error {
  /**
   * The property used by `handle` to infer that this error contains a body that
   * can be exposed in the HTTP response.
   */
  public isJsonResponse = true as const;

  /**
   * Creates a new `JsonResponse`
   *
   * @param statusCode - The status code to show in the response
   *
   * @param message - Plain text message used for requests preferring
   *                  `text/plain`. This is also used as the `Error` superclass
   *                  message.
   *
   * @param body - JavaScript value used for requests accepting
   *               `application/json`. This is encoded as JSON in the response.
   */
  constructor(
    public statusCode: number,
    public message: string,
    public body?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const plugin: FastifyPluginAsync = fastifyPlugin(
  async (fastify, _opts) => {
    await fastify.register(fastifyAccepts);
    fastify.setErrorHandler((err: unknown, req, reply) => {
      req[ERROR_STATE_KEY] = err;

      if (
        !isObject(err) ||
        !(typeof err.statusCode === 'number' || typeof err.status === 'number')
      ) {
        fastify.log.error({ err }, 'unknown error');
        return reply.code(500).send('');
      }

      const statusCode = (err.statusCode ?? err.status) as number;

      const expose = statusCode < 500;
      if (
        expose &&
        err.isJsonResponse === true &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        req.accepts().type(['json'])
      ) {
        return reply.code(statusCode).send(err.body);
      }

      return reply.code(statusCode).send((expose && err.message) || '');
    });
  },
);
