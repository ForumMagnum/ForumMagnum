import React from "react";
import EmailTokenPage from '@/components/users/EmailTokenPage';
import RouteRoot from "@/components/layout/RouteRoot";

export default async function Page({ params }: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params;
  return <RouteRoot>
    <EmailTokenPage token={token} />
  </RouteRoot>
}
