"use client";

import ModerationTemplatesPage from '@/components/moderationTemplates/ModerationTemplatesPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Moderation Message Templates</title></Helmet>
      <ModerationTemplatesPage />
    </>
  );
}
