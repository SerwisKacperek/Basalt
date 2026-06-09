import { Elysia } from 'elysia';

export const logger = new Elysia({ name: 'logger' })
  .onAfterResponse({ as: 'global' }, ({ request, set }) => {
    const url = new URL(request.url);
    console.log(`[${set.status}] ${request.method} ${url.pathname}`);
  });
