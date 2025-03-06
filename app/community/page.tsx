"use client";

import CommunityHome from '@/components/localGroups/CommunityHome';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Community</title></Helmet>
      <CommunityHome />
    </>
  );
}
