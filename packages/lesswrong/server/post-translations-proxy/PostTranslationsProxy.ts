import type { Application, Request, Response } from 'express';

export interface PostTranslationsResponse {
  "url": string;
  "title": string;
  "language": string;
}

export const addPostTranslationsProxy = (app: Application) => {
  app.get(
    '/api/post-translations-proxy/:postId',
    async (
      req: Request,
      res: Response<
        | PostTranslationsResponse[]
        | { error: string; status?: number; message?: string }
      >
    ) => {
      const targetUrl = `https://ea.international/api/translations/forummagnum`;

      try {
        const response = await fetch(targetUrl);
        // Forward relevant headers 
        for (const header of ['content-type', 'cache-control']) {
          const value = response.headers.get(header);
          if (value) {
            res.set(header, value);
          }
        }

        if (response.ok) {
          const data = (await response.json()) as Record<string, PostTranslationsResponse[]>;
          res.status(200).json(data[req.params.postId] || []);
        } else {
          res.status(response.status).json({
            error: 'Upstream service error',
            status: response.status,
          });
        }
      } catch (error: unknown) {
        // eslint-disable-next-line no-console
        console.error('Post translations proxy error:', error);
        res.status(502).json({
          error: 'Bad Gateway',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }      
    }
  );
};
