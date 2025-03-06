"use client";

import ArbitalExplorePage from '@/components/tagging/ArbitalExplorePage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Arbital</title></Helmet>
      <ArbitalExplorePage />
    </>
  );
}
