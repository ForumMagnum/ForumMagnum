"use client";

import GlossaryEditorPage from '@/components/jargon/GlossaryEditorPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Glossary Editor</title></Helmet>
      <GlossaryEditorPage />
    </>
  );
}
