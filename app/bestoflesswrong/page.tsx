import React from "react";
import TopPostsPage from '@/components/sequences/TopPostsPage';
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getMetadataDescriptionFields(`${siteNameWithArticleSetting.get()}'s best posts`),
    getPageTitleFields('The Best of LessWrong'),
    getMetadataImagesFields('https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709263848/Screen_Shot_2024-02-29_at_7.30.43_PM_m5pyah.png'),
  );
}

export default function Page() {
  return <RouteRoot metadata={{
    subtitle: 'The Best of LessWrong',
    subtitleLink: '/leastwrong',
    background: '#f8f4ee'
  }}>
    <TopPostsPage />
  </RouteRoot>;
}
