import { createContext, use } from 'react';

export type ServerInsertedHtml = {
  pendingBlocks: string[]
};
export const ServerInsertedHtmlContext = createContext<ServerInsertedHtml|null>(null);

export const createServerInsertedHtmlContext = (): ServerInsertedHtml => {
  return {
    pendingBlocks: []
  };
}

/**
 * If this component is being SSR'ed, inject HTML into the response stream.
 * This hook has the same name and approximately the same effect as the nextjs
 * function of the same name (but is implemented and works in the non-nextjs
 * branch).
 *
 * See also: ResponseForwarderStream::waitForInsertionPointAndFlush
 */
export const useServerInsertedHtml = (fn: () => string|null) => {
  const context = use(ServerInsertedHtmlContext);
  if (context) {
    const html = fn();
    if (html) {
      context.pendingBlocks.push(html);
    }
  }
}

