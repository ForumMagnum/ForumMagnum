"use client";

import UserReviews from '@/components/review/UserReviews';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>User Reviews</title></Helmet>
      <UserReviews />
    </>
  );
}
