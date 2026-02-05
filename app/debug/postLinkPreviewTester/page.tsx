import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { PostLinkPreviewTester } from "./PostLinkPreviewTester";

export default async function Page({ searchParams }: {
  searchParams?: Promise<{ postId: string|null }>
}) {
  const postId = (await searchParams)?.postId ?? null;
  return (
    <RouteRoot>
      <PostLinkPreviewTester postId={postId} />
    </RouteRoot>
  );
}
