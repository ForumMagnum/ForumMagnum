import type { ForumTypeString } from "@/lib/instanceSettings";
import { getForumTypeForPage } from '@/server/utils/requestUtil';
import { gql } from '@/lib/generated/gql-codegen';
import { noIndexSetting, tabLongTitleSetting, tabTitleSetting, taglineSetting, siteImageSetting } from '@/lib/instanceSettings';
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { CombinedGraphQLErrors } from '@apollo/client';
import { captureException } from '@/lib/sentryWrapper';
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getRequestIdForServerComponentOrGenerateMetadata } from '../rendering/requestId';
import { getResolverContextForSSR } from '@/server/rendering/ssrApolloClient';

const IGNORED_ERROR_MESSAGES = new Set(['app.operation_not_allowed', 'app.missing_document']);

export const CommentPermalinkMetadataQuery = gql(`
  query CommentPermalinkMetadata($commentId: String) {
    comment(selector: { _id: $commentId }) {
      result {
        _id
        user {
          displayName
        }
        contents {
          plaintextMainText
        }
        deleted
      }
    }
  }
`);

export const noIndexMetadata = { robots: { index: false } };

/**
 * charset='utf-8' and viewport content='width=devicewidth, initial-scale=1' are set by default
 * https://nextjs.org/docs/app/getting-started/metadata-and-og-images#default-fields
 */
export async function getDefaultMetadata() {
  const forumType = await getForumTypeForPage();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  return {
    title: tabLongTitleSetting.get(forumType) || tabTitleSetting.get(forumType),
    description: taglineSetting.get(forumType),
    twitter: {
      description: taglineSetting.get(forumType),
      images: siteImageSetting.get(forumType),
      ...(userAgent?.startsWith("Slackbot-LinkExpanding") ? { card: "summary_large_image" } : { card: "summary" }),
    },
    openGraph: {
      title: tabLongTitleSetting.get(forumType) || tabTitleSetting.get(forumType),
      type: 'article',
      url: getSiteUrl(forumType),
      description: taglineSetting.get(forumType),
      images: siteImageSetting.get(forumType),
    },
    alternates: {
      canonical: getSiteUrl(forumType),
      types: {
        'application/rss+xml': `${getSiteUrl(forumType)}feed.xml`,
      }
    },
    ...(noIndexSetting.get(forumType) ? noIndexMetadata : {})
  } satisfies Metadata;
}

function getPageTitleString(title: string, forumType: ForumTypeString) {
  const siteName = tabTitleSetting.get(forumType) ?? tabLongTitleSetting.get(forumType);
  return `${title} — ${siteName}`;
}

export async function getPageTitleFields(title: string): Promise<Metadata> {
  const forumType = await getForumTypeForPage();
  return {
    title: getPageTitleString(title, forumType),
    openGraph: {
      title: getPageTitleString(title, forumType),
    },
  };
}

export function getMetadataDescriptionFields(description: string|null): Metadata {
  if (!description) {
    return {};
  }
  return {
    description,
    twitter: {
      description,
    },
    openGraph: {
      description,
    },
  };
}

export function getMetadataImagesFields(images: string|null): Metadata {
  if (!images) {
    return {};
  }
  return {
    twitter: {
      ...(images ? { images } : {}),
    },
    openGraph: {
      ...(images ? { images } : {}),
    },
  };
}

export function getCommentDescription(comment: CommentPermalinkMetadataQuery_comment_SingleCommentOutput_result_Comment) {
  if (comment.deleted) {
    return '[Comment deleted]';
  }

  return `Comment ${comment.user ? 
    `by ${comment.user.displayName} ` : 
    ''
  }- ${comment.contents?.plaintextMainText}`;
}

function shouldIgnoreError(error: unknown) {
  if (error instanceof Error && 'digest' in error && typeof error.digest === 'string' && error.digest?.endsWith(';404')) {
    return true;
  }

  if (error instanceof Error && IGNORED_ERROR_MESSAGES.has(error.message)) {
    return true;
  }

  if (error instanceof CombinedGraphQLErrors && error.errors.every(error => IGNORED_ERROR_MESSAGES.has(error.message))) {
    return true;
  }

  return false;
}

/**
 * Handle an error thrown while generating page metadata by falling back to the
 * site-default metadata. Deliberately not `notFound()`: that would put a 404
 * digest in the RSC payload, which makes the client render the not-found page
 * regardless of what the page's own SSR decided, while being unable to affect
 * the HTTP status (metadata streams in after the status is committed). The
 * page component owns the error UI and status code (via StatusCodeSetter).
 */
export function handleMetadataError(prefix: string, error: unknown): Promise<Metadata> {
  // Don't log on noisy permission/not found errors; we have a lot of scrapers which
  // end up hitting posts that are now drafts, don't exist, etc.
  if (!shouldIgnoreError(error)) {
    //eslint-disable-next-line no-console
    console.error(`${prefix}:`, error);
    captureException(error);
  }
  return getDefaultMetadata();
}

/**
 * Get a ResolverContext for use during metadata generation, given search params from the URL.
 */
export async function getResolverContextForGenerateMetadata(searchParams: Record<string, string>): Promise<ResolverContext> {
  const requestId = await getRequestIdForServerComponentOrGenerateMetadata();
  const searchParamsStr = JSON.stringify(searchParams);
  return await getResolverContextForSSR(searchParamsStr, requestId);
}

