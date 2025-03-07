"use client";
export const dynamic = 'force-dynamic';
import CoreSequences from '@/components/sequences/CoreSequences';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Rationality: A-Z</title></Helmet>
      <CoreSequences />
    </>
  );
}
