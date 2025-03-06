"use client";

import Books from '@/components/sequences/Books';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Books</title></Helmet>
      <Books />
    </>
  );
}
