"use client";
export const dynamic = 'force-dynamic';
import Book2019Landing from '@/components/books/Book2019Landing';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Books: Engines of Cognition</title></Helmet>
      <Book2019Landing />
    </>
  );
}
