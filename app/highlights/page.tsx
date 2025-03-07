"use client";
export const dynamic = 'force-dynamic';

import SequencesHighlightsCollection from '@/components/sequences/SequencesHighlightsCollection';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Sequences Highlights</title></Helmet>
      <SequencesHighlightsCollection />
    </>
  );
}
