"use client";

import TagVoteActivity from '@/components/tagging/TagVoteActivity';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Tag Voting Activity</title></Helmet>
      <TagVoteActivity />
    </>
  );
}
