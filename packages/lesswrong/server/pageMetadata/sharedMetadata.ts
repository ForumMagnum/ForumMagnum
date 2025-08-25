import { gql } from '@/lib/generated/gql-codegen';
import { noIndexSetting, tabLongTitleSetting, tabTitleSetting, taglineSetting, siteImageSetting } from '@/lib/instanceSettings';
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import type { Metadata } from "next";
import { headers } from "next/headers";

const defaultDescription = taglineSetting.get();
const siteImage = siteImageSetting.get();

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
    description: defaultDescription,
    twitter: {
      description: defaultDescription,
      images: siteImage,
      ...(userAgent?.startsWith("Slackbot-LinkExpanding") ? { card: "summary_large_image" } : { card: "summary" }),
    },
    openGraph: {
      title: tabLongTitleSetting.get() || tabTitleSetting.get(),
      type: 'article',
      url: getSiteUrl(),
      description: defaultDescription,
      images: siteImage,
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
