"use client";

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
