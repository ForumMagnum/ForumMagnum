import React from "react";
import Book2018Landing from '@/components/books/Book2018Landing';
import { getDefaultMetadata, getMetadataDescriptionFields, getMetadataImagesFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getPageTitleFields('Books: A Map that Reflects the Territory'),
    getMetadataDescriptionFields('LessWrong is now a book.'),
    getMetadataImagesFields('https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606944736/Screen_Shot_2020-11-30_at_10.17.10_PM_copy_mleu4a.png'),
  );
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <Book2018Landing />
  </RouteRoot>;
}
