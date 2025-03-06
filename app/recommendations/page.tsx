"use client";

import RecommendationsPage from '@/components/recommendations/RecommendationsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Recommendations</title></Helmet>
      <RecommendationsPage />
    </>
  );
}
