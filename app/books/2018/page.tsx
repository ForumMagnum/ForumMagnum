"use client";

import Book2018Landing from '@/components/books/Book2018Landing';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Books: A Map that Reflects the Territory</title></Helmet>
      <Book2018Landing />
    </>
  );
}
