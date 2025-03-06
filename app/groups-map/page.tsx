"use client";

import GroupsMap from '@/components/localGroups/GroupsMap';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Groups Map</title></Helmet>
      <GroupsMap />
    </>
  );
}
