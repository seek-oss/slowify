# 🦥 Error Plugin 🦥

## Introduction

Catches errors thrown from downstream, as specified here:

<https://www.fastify.io/docs/latest/Reference/Errors/#catching-uncaught-errors-in-fastify>

## Usage

```typescript
import { ErrorPlugin } from '@seek/slowify';
import { fastify } from 'fastify';
import { logger } from 'src/framework/logging';

export const createApp = async () => {
  const server = fastify();
  await server.register(ErrorPlugin.plugin);

  await server.ready();
  return server;
};
```

## JsonResponse

`JsonResponse` is a custom error type used to support JSON error response bodies. The default error handler in Fastify only allows for customisation of the `message` field. This plugin allows for additional fields to be provided to the caller. Its constructor takes a `statusCode` number, `message` string and a `body` value. If the request accepts JSON then the error response will include the JSON encoded body.

```typescript
import { ErrorPlugin } from '@seek/slowify';

fastify.get('/', async (req, reply) => {
  throw new ErrorPlugin.JsonResponse(400, 'Bad input', {
    message: 'Bad input',
    invalidFields: { '/path/to/field': 'Value out of range' },
  });
});
```

The caller will be shown the following 400 response

```json
{
  "message": "Bad Input",
  "invalidFields": { "/path/to/field": "Value out of range" }
}
```

You can also bring your own child Error class by exposing an isJsonResponse property set to true.

## Handling Unknown Errors

The default [Fastify error handler](https://www.fastify.io/docs/latest/Reference/Reply/#errors) will return a 500 error with the `message` field on any error thrown, to the caller. This may unintentionally reveal too much internal information to the caller.

This plugin will instead return a generic 500 error response to the caller instead for any error which does not contain a `statusCode` or `status` field. The logger provided to the error plugin is then called with the following call: `logger.error({ err }, 'unknown error')`.

This error plugin stores the error thrown in the Fastify request object under the exported const symbol `ERROR_STATE_KEY` if you wish to access it yourself.
