import { getIsolationScope } from "@sentry/nextjs";
import { isProduction, isServer } from "./executionEnvironment";
import { winterCGHeadersToDict } from "./vendor/sentry/request";
import type { ForumTypeString } from "./instanceSettings"
import type { RequestAsyncStorage } from "node_modules/@sentry/nextjs/build/types/config/templates/requestAsyncStorageShim";

export const forumTypeSetting: { get: () => ForumTypeString } = {
  get: () => {
    let urlObj: URL | undefined = undefined;
    if (isServer) {
      const scope = getIsolationScope();
      const url = scope.getScopeData().sdkProcessingMetadata.normalizedRequest?.url;
      if (url) {
        urlObj = new URL(url);
      // We've observed that Sentry sometimes doesn't have a `normalizedRequest` in its `sdkProcessingMetadata`
      // immediately post-deploy, or otherwise with timing that seems a bit like it's related to cold starts,
      // so in those cases we use the same undocumented private NextJS feature to grab the headers from the
      // current request, which do seem to more reliably exist.
      } else if (isProduction) {
        const { workUnitAsyncStorage }: typeof import("next/dist/server/app-render/work-unit-async-storage.external") = require("next/dist/server/app-render/work-unit-async-storage.external");
        const asyncLocalStorage = workUnitAsyncStorage.getStore() as ReturnType<RequestAsyncStorage['getStore']>;
        const headers = asyncLocalStorage?.headers ? winterCGHeadersToDict(asyncLocalStorage.headers) : {};
        // We get the referer when handling requests to server components and generation functions (i.e. for metadata)
        const headerReferer = headers.referer;
        // We get the host when handling requests to API route handlers
        const headerHost = headers['x-forwarded-host'] ?? headers['host'];

        const fallbackHost = headerReferer ?? headerHost;
        if (fallbackHost) {
          urlObj = new URL(fallbackHost);
        } else {
          // eslint-disable-next-line no-console
          console.error('No fallback host found, using default.', headers);
        }
      }

      if (!urlObj) {
        return process.env.FORUM_TYPE as ForumTypeString | undefined ?? 'LessWrong';
      }
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
