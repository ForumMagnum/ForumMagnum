"use client";

import SequencesNewForm from '@/components/sequences/SequencesNewForm';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>New Sequence</title></Helmet>
      <SequencesNewForm />
    </>
  );
}
