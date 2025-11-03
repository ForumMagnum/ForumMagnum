import React from 'react';
import RouteRoot from '@/components/layout/RouteRoot';
import { getDefaultMetadata, getPageTitleFields, noIndexMetadata } from '@/server/pageMetadata/sharedMetadata';
import merge from 'lodash/merge';
import CommentEmbeddingsPage from '@/components/commentEmbeddings/CommentEmbeddingsPage';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Comment Embeddings'), { ...noIndexMetadata });
}

export default function Page() {
  return <RouteRoot>
    <CommentEmbeddingsPage />
  </RouteRoot>
}
