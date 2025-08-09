import React from "react";
import SequencesSingle from '@/components/sequences/SequencesSingle';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ _id: string }> }): Promise<Metadata> {
  const { _id } = await params;

  const ogUrl = combineUrls(getSiteUrl(), `/s/${_id}`);
  const canonicalUrl = sequenceGetPageUrl({ _id }, true);

  return merge({}, defaultMetadata, {
    openGraph: { url: ogUrl },
    alternates: { canonical: canonicalUrl },
  });
}

export default function Page() {
  return <SequencesSingle />;
}
