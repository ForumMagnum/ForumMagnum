"use client";

import LoginPage from '@/components/users/LoginPage';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Login</title></Helmet>
      <LoginPage />
    </>
  );
}
