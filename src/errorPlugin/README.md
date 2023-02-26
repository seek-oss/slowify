# 🦥 Error Plugin 🦥

## Introduction

Catches errors thrown from downstream, as specified here:

<https://www.fastify.io/docs/latest/Reference/Errors/#catching-uncaught-errors-in-fastify>

## Usage

```typescript
import { ErrorPlugin } from '@seek/slowify';
import { fastify } from 'fastify';
import { logger } from 'src/framework/logging';

const errorPlugin = ErrorPlugin.create(logger);

export const createApp = async () => {
  const server = fastify();
  await server.register(errorPlugin);

  await server.ready();
  return server;
};
```

## JsonResponse

`JsonResponse` is a custom error type used to support JSON error response bodies. The default error handler in Fastify only allows for customisation of the `message` field. This plugin allows for additional fields to be provided to the caller. The constructor takes a `statusCode` and `fields` object which contains a mandatory `message` field which are exposed to the caller.

```typescript
import { ErrorPlugin } from '@seek/slowify';

fastify.get('/', async (req, reply) => {
  throw new ErrorPlugin.JsonResponse(400, {
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

## Handling Unknown Errors

The default [Fastify error handler](https://www.fastify.io/docs/latest/Reference/Reply/#errors) will return a 500 error with the `message` field on any error thrown, to the caller. This may unintentionally reveal too much internal information to the caller.

This plugin will instead return a generic 500 error with a JSON `{ "message": "Internal Server Error"}` response to the caller instead for any error which is not a [JsonResponse](#jsonresponse) error. The logger provided to the error plugin is then called with the following call: `logger.error({ err }, 'unknown error')`.
