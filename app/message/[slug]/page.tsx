import React from "react";
import MessageUser from '@/components/messaging/MessageUser';
import RouteRoot from "@/components/layout/RouteRoot";


export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode>
    <MessageUser slug={slug} />
  </RouteRoot>
}
