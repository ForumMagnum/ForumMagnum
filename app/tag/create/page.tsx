"use client";

import NewTagPage from '@/components/tagging/NewTagPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>New Tag</title></Helmet>
      <NewTagPage />
    </>
  );
}
