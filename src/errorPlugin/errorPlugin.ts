import { FastifyPluginAsync } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

interface Logger {
  error: (...input: any[]) => void;
}

interface Response {
  message: string;
  [key: string]: unknown;
}

export class JsonResponse extends Error {
  public name = 'JsonResponse';
  /**
   *
   * @param statusCode - http status code displayed to client
   * @param additionalFields - optional additional fields to display to client
   */
  constructor(public statusCode: number, public response: Response) {
    super(response.message);
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
