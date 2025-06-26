
import { noIndexSetting, taglineSetting } from "@/lib/instanceSettings";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import type { Metadata } from "next";

const defaultDescription = taglineSetting.get();

/**
 * charset='utf-8' and viewport content='width=devicewidth, initial-scale=1' are set by default
 * https://nextjs.org/docs/app/getting-started/metadata-and-og-images#default-fields
 */
export const defaultMetadata: Metadata = {
  description: defaultDescription,
  twitter: {
    description: defaultDescription,
  },
  openGraph: {
    type: 'article',
    url: getSiteUrl(),
    description: defaultDescription,
  },
  alternates: {
    canonical: getSiteUrl(),
    types: {
      'application/rss+xml': `${getSiteUrl()}feed.xml`,
    }
  },
  ...(noIndexSetting.get() ? { robots: { index: false } } : {})
};