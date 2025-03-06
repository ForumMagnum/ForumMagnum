"use client";

import InboxWrapper from '@/components/messaging/InboxWrapper';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Inbox</title></Helmet>
      <InboxWrapper />
    </>
  );
}
