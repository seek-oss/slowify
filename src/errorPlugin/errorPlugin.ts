import { FastifyPluginAsync } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

interface Logger {
  error: (...input: any[]) => void;
}

export class JsonResponse extends Error {
  public name = 'JsonResponse';
  /**
   *
   * @param statusCode http status code displayed to client
   * @param message `message` field displayed to client
   * @param additionalFields optional additional fields to display to client
   */
  constructor(
    public statusCode: number,
    public message: string,
    public additionalFields?: Record<string, unknown>,
  ) {
    super(message);
  }
  get response() {
    return {
      message: this.message,
      ...this.additionalFields,
    };
  }
}

export const create = (logger: Logger): FastifyPluginAsync =>
  fastifyPlugin(async (fastify, _opts) => {
    fastify.setErrorHandler((err, _req, reply) => {
      if (err instanceof JsonResponse) {
        return reply.code(err.statusCode).send(err.response);
      }

      logger.error({ err }, 'unknown error');

      return reply.code(500).send({ message: 'Internal Server Error' });
    });
  });
