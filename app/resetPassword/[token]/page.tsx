import React from "react";
import PasswordResetPage from '@/components/users/PasswordResetPage';
import RouteRoot from "@/components/layout/RouteRoot";

export default async function Page({ params }: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params;
  return <RouteRoot>
    <PasswordResetPage token={token} />
  </RouteRoot>
}
