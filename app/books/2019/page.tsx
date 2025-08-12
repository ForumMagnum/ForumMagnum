import React from "react";
import Book2019Landing from '@/components/books/Book2019Landing';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getPageTitleFields('Books: Engines of Cognition'),
    getMetadataDescriptionFields('LessWrong is now a book.'),
    getMetadataImagesFields('https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606944736/Screen_Shot_2020-11-30_at_10.17.10_PM_copy_mleu4a.png'),
  );
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <Book2019Landing />
  </>;
}
