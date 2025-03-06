"use client";

import SpotlightsPage from '@/components/spotlights/SpotlightsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Spotlights Page</title></Helmet>
      <SpotlightsPage />
    </>
  );
}
