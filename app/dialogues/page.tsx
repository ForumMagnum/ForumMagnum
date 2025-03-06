"use client";

import DialoguesPage from '@/components/dialogues/DialoguesPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Dialogues</title></Helmet>
      <DialoguesPage />
    </>
  );
}
