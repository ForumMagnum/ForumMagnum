import { gql } from '@/lib/generated/gql-codegen';
import { noIndexSetting, tabLongTitleSetting, tabTitleSetting, taglineSetting, siteImageSetting } from '@/lib/instanceSettings';
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { CombinedGraphQLErrors } from '@apollo/client';
import { captureException } from '@/lib/sentryWrapper';
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from 'next/navigation';

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
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  return {
    title: tabLongTitleSetting.get() || tabTitleSetting.get(),
    description: taglineSetting.get(),
    twitter: {
      description: taglineSetting.get(),
      images: siteImageSetting.get(),
      ...(userAgent?.startsWith("Slackbot-LinkExpanding") ? { card: "summary_large_image" } : { card: "summary" }),
    },
    openGraph: {
      title: tabLongTitleSetting.get() || tabTitleSetting.get(),
      type: 'article',
      url: getSiteUrl(),
      description: taglineSetting.get(),
      images: siteImageSetting.get(),
    },
    alternates: {
      canonical: getSiteUrl(),
      types: {
        'application/rss+xml': `${getSiteUrl()}feed.xml`,
      }
    },
    ...(noIndexSetting.get() ? noIndexMetadata : {})
  } satisfies Metadata;
}

function getPageTitleString(title: string) {
  const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
  return `${title} — ${siteName}`;
}

export function getPageTitleFields(title: string) {
  return {
    title: getPageTitleString(title),
    openGraph: {
      title: getPageTitleString(title),
    },
  } satisfies Metadata;
}

export function getMetadataDescriptionFields(description: string) {
  return {
    description,
    twitter: {
      description,
    },
    openGraph: {
      description,
    },
  } satisfies Metadata;
}

export function getMetadataImagesFields(images: string) {
  return {
    twitter: {
      ...(images ? { images } : {}),
    },
    openGraph: {
      ...(images ? { images } : {}),
    },
  } satisfies Metadata;
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
  if (error instanceof Error && IGNORED_ERROR_MESSAGES.has(error.message)) {
    return true;
  }

  if (error instanceof CombinedGraphQLErrors && error.errors.every(error => IGNORED_ERROR_MESSAGES.has(error.message))) {
    return true;
  }

  return false;
}

export function handleMetadataError(prefix: string, error: unknown) {
  // Don't log on noisy permission/not found errors; we have a lot of scrapers which 
  // end up hitting posts that are now drafts, don't exist, etc.
  if (shouldIgnoreError(error)) {
    return notFound();
  }

  //eslint-disable-next-line no-console
  console.error(`${prefix}:`, error);
  captureException(error);
  return notFound();
}
