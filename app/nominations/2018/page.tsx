"use client";

import Nominations2018 from '@/components/review/Nominations2018';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>2018 Nominations</title></Helmet>
      <Nominations2018 />
    </>
  );
}
