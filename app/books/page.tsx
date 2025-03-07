"use client";
export const dynamic = 'force-dynamic';

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
