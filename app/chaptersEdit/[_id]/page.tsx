"use client";

import ChaptersEditForm from '@/components/sequences/ChaptersEditForm';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Edit Chapter</title></Helmet>
      <ChaptersEditForm />
    </>
  );
}
