"use client";

import '@/lib/collections/lwevents/collection'
import Nominations2019 from '@/components/review/Nominations2019';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>2019 Nominations</title></Helmet>
      <Nominations2019 />
    </>
  );
}
