"use client";

import UsersAccount from '@/components/users/account/UsersAccount';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Account Settings</title></Helmet>
      <UsersAccount />
    </>
  );
}
