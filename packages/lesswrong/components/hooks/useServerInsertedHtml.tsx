import { createContext, use } from 'react';

export type ServerInsertedHtml = {
  callbacks: Array<() => string|null>;
};
export const ServerInsertedHtmlContext = createContext<ServerInsertedHtml|null>(null);

export const createServerInsertedHtmlContext = (): ServerInsertedHtml => {
  return {
    callbacks: []
  };
}

/**
 * If this component is being SSR'ed, inject HTML into the response stream.
 * The provided callback function will be rerun once per insertion point; each
 * insertion should be returned only once.
 *
 * This hook has the same name and approximately the same effect as the nextjs
 * function of the same name (but is implemented and works in the non-nextjs
 * branch).
 *
 * See also: ResponseForwarderStream::waitForInsertionPointAndFlush
 */
export const useServerInsertedHtml = (fn: () => string|null) => {
  const context = use(ServerInsertedHtmlContext);
  if (context) {
    context.callbacks.push(fn);
  }
}

