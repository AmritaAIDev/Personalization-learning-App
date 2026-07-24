import type { Request, Response } from 'express';
import 'pg';
import { createNestApp } from '../src/bootstrap';

type ExpressServer = (request: Request, response: Response) => void;

let cachedServer: ExpressServer | null = null;

async function getServer(): Promise<ExpressServer> {
  if (cachedServer) return cachedServer;
  const app = await createNestApp({ enableShutdownHooks: false });
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance() as ExpressServer;
  return cachedServer;
}

export default async function handler(request: Request, response: Response) {
  const server = await getServer();
  return server(request, response);
}
