"use client";

import ConversationWrapper from '@/components/messaging/ConversationWrapper';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Private Conversation</title></Helmet>
      <ConversationWrapper />
    </>
  );
}
