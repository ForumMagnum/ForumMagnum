"use client";

import ShortformPage from '@/components/shortform/ShortformPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Quick Takes</title></Helmet>
      <ShortformPage />
    </>
  );
}
