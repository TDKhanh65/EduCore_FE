import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const apiTargetOrigin = process.env['API_TARGET_ORIGIN'] || 'https://educore-uuoe.onrender.com';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api/{*splat}', express.raw({ type: '*/*', limit: '10mb' }), async (req, res, next) => {
  try {
    const targetUrl = new URL(req.originalUrl, apiTargetOrigin);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || ['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((headerValue) => headers.append(key, headerValue));
      } else {
        headers.set(key, value);
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
