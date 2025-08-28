import { getIsolationScope, captureException, isInitialized } from "@sentry/nextjs";
import { isProduction, isServer } from "./executionEnvironment";
import type { ForumTypeString } from "./instanceSettings"
import type { RequestAsyncStorage } from "node_modules/@sentry/nextjs/build/types/config/templates/requestAsyncStorageShim";
import type { WebFetchHeaders } from "@sentry/core";

/**
 * Transforms a `Headers` object that implements the `Web Fetch API` (https://developer.mozilla.org/en-US/docs/Web/API/Headers) into a simple key-value dict.
 * The header keys will be lower case: e.g. A "Content-Type" header will be stored as "content-type".
 */
export function winterCGHeadersToDict(winterCGHeaders: WebFetchHeaders): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    winterCGHeaders.forEach((value, key) => {
      if (typeof value === 'string') {
        // We check that value is a string even though it might be redundant to make sure prototype pollution is not possible.
        headers[key] = value;
      }
    });
  } catch {
    // just return the empty headers
  }

  return headers;
}

export const forumTypeSetting: { get: () => ForumTypeString } = {
  get: () => {
    let urlObj: URL;
    if (isServer) {
      const scope = getIsolationScope();
      const url = scope.getScopeData().sdkProcessingMetadata.normalizedRequest?.url;
      if (!url) {
        if (isProduction) {
          const { workUnitAsyncStorage }: typeof import("next/dist/server/app-render/work-unit-async-storage.external") = require("next/dist/server/app-render/work-unit-async-storage.external");
          const asyncLocalStorage = workUnitAsyncStorage.getStore() as ReturnType<RequestAsyncStorage['getStore']>;
          const headers = asyncLocalStorage?.headers ? winterCGHeadersToDict(asyncLocalStorage.headers) : {};
          const headerReferer = headers.referer;

          // eslint-disable-next-line no-console
          console.error(
            'No URL found in scope',
            scope.getScopeData().sdkProcessingMetadata.normalizedRequest,
            headerReferer,
            headers,
          );
          // eslint-disable-next-line no-console
          console.error(new Error());

          // captureException(new Error('No URL found in scope'));
        }
        return process.env.FORUM_TYPE as ForumTypeString | undefined ?? 'LessWrong';
      }
      urlObj = new URL(url);
    } else {
      urlObj = new URL(window.location.href);
    }
    if (urlObj.hostname.includes('alignmentforum.org')) {
      return 'AlignmentForum';
    } else if (urlObj.hostname.includes('forum.effectivealtruism.org')) {
      return 'EAForum';
    } else {
      return process.env.FORUM_TYPE as ForumTypeString | undefined ?? 'LessWrong';
    }
  }
};

export const isLW = () => forumTypeSetting.get() === "LessWrong"
export const isEAForum = () => forumTypeSetting.get() === "EAForum"
export const isAF = () => forumTypeSetting.get() === "AlignmentForum"
export const isLWorAF = () => isLW() || isAF()

//Partial Type adds "undefined" erroneously to T, so we need to explicitly tell TS that it can't be undefined.
type NonUndefined<T> = T extends undefined ? never : T;

type ComboForumTypeString = Exclude<ForumTypeString, "LessWrong" | "AlignmentForum"> | "LWAF";

export type ForumOptions<T> = Record<ForumTypeString, T> |
  Record<ComboForumTypeString, T> |
  (Partial<Record<ForumTypeString, T>> & {default: T}) |
  (Partial<Record<ComboForumTypeString, T>> & {default: T});

export function forumSelect<T>(forumOptions: ForumOptions<T>, forumType?: ForumTypeString): NonUndefined<T> {
  forumType ??= forumTypeSetting.get();
  if (forumType in forumOptions) {
    return (forumOptions as AnyBecauseTodo)[forumType] as NonUndefined<T> // The default branch ensures T always exists
  }
  if ((forumType === "LessWrong" || forumType === "AlignmentForum") && "LWAF" in forumOptions) {
    return forumOptions["LWAF"] as NonUndefined<T>
  }
  // @ts-ignore - if we get here, our type definition guarantees that there's a default set
  return forumOptions.default
}

export class DeferredForumSelect<T> {
  constructor(private forumOptions: ForumOptions<T>) {}

  getDefault() {
    return "default" in this.forumOptions ? this.forumOptions.default : undefined;
  }

  get(forumType?: ForumTypeString): NonUndefined<T> {
    return forumSelect(this.forumOptions, forumType);
  }
}
