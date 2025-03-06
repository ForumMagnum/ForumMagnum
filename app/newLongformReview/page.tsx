"use client";

import NewLongformReviewForm from '@/components/review/NewLongformReviewForm';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>New Longform Review</title></Helmet>
      <NewLongformReviewForm />
    </>
  );
}
