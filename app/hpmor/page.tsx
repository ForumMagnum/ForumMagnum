"use client";

import HPMOR from '@/components/sequences/HPMOR';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Harry Potter and the Methods of Rationality</title></Helmet>
      <HPMOR />
    </>
  );
}
