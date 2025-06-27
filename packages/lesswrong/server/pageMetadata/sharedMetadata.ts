
import { noIndexSetting, tabLongTitleSetting, tabTitleSetting, taglineSetting } from "@/lib/instanceSettings";
import { siteImageSetting } from "@/lib/publicSettings";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import type { Metadata } from "next";

const defaultDescription = taglineSetting.get();
const siteImage = siteImageSetting.get();


/**
 * charset='utf-8' and viewport content='width=devicewidth, initial-scale=1' are set by default
 * https://nextjs.org/docs/app/getting-started/metadata-and-og-images#default-fields
 */
export const defaultMetadata = {
  description: defaultDescription,
  twitter: {
    description: defaultDescription,
    images: siteImage,
  },
  openGraph: {
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
  ...(noIndexSetting.get() ? { robots: { index: false } } : {})
} satisfies Metadata;

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
