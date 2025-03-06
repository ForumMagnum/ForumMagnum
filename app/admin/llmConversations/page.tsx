"use client";

import LlmConversationsViewingPage from '@/components/languageModels/LlmConversationsViewingPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>LLM Conversations Viewer</title></Helmet>
      <LlmConversationsViewingPage />
    </>
  );
}
