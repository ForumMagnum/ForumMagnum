"use client";

import ModeratorInboxWrapper from '@/components/messaging/ModeratorInboxWrapper';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Moderator Inbox</title></Helmet>
      <ModeratorInboxWrapper />
    </>
  );
}
