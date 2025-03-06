"use client";

import ResendVerificationEmailPage from '@/components/users/ResendVerificationEmailPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Email Verification</title></Helmet>
      <ResendVerificationEmailPage />
    </>
  );
}
