"use client";

import RandomUserPage from '@/components/admin/RandomUserPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Random User</title></Helmet>
      <RandomUserPage />
    </>
  );
}
