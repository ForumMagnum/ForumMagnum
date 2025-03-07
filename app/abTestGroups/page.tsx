"use client";
export const dynamic = 'force-dynamic';
import UsersViewABTests from '@/components/users/UsersViewABTests';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>A/B Test Groups</title></Helmet>
      <UsersViewABTests />
    </>
  );
}
