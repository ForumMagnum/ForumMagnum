"use client";

import QuestionsPage from '@/components/questions/QuestionsPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>All Questions</title></Helmet>
      <QuestionsPage />
    </>
  );
}
