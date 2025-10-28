import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata({ params }: { params: Promise<{ _id: string }> }): Promise<Metadata> {
  const [{ _id }, defaultMetadata] = await Promise.all([
    params,
    getDefaultMetadata(),
  ]);

  const ogUrl = combineUrls(getSiteUrl(), `/s/${_id}`);
  const canonicalUrl = sequenceGetPageUrl({ _id }, true);

  return merge({}, defaultMetadata, {
    openGraph: { url: ogUrl },
    alternates: { canonical: canonicalUrl },
  });
}

export default function Page() {
  return <RouteRoot>
    <SequencesSingle />
  </RouteRoot>
}
