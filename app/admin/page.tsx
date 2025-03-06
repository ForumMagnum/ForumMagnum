"use client";

import AdminHome from '@/components/admin/AdminHome';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Admin</title></Helmet>
      <AdminHome />
    </>
  );
}
