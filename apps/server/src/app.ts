import type { FastifyInstance } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRuntimeApp } from './runtime.js';
export { buildApp } from './app-factory.js';

// A runtime-only, lazy HTTP entrypoint for Vercel's Fastify function.
// Shared app construction does not start a port or read credentials during a build.
let runtime: Promise<FastifyInstance> | undefined;
export default async function handler(request:IncomingMessage,response:ServerResponse) {
  const app=await (runtime??=createRuntimeApp({readOnlySnapshot:true})).catch((error:unknown)=>{
    console.error(error instanceof Error ? error.message : 'API runtime initialization failed');
    throw error;
  });
  await app.ready();
  app.server.emit('request',request,response);
}
