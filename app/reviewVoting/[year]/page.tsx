"use client";

import AnnualReviewPage from '@/components/review/AnnualReviewPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Review Voting</title></Helmet>
      <AnnualReviewPage />
    </>
  );
}
