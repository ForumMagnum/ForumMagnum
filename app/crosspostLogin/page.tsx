"use client";

import CrosspostLoginPage from '@/components/users/CrosspostLoginPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Crosspost Login</title></Helmet>
      <CrosspostLoginPage />
    </>
  );
}
