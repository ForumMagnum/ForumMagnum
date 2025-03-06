"use client";

import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Search</title></Helmet>
      <SearchPageTabbed />
    </>
  );
}
