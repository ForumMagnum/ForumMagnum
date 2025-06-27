import React from "react";
import UsersSingle from '@/components/users/UsersSingle';
import { UserPageTitle } from '@/components/titles/UserPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { /* TODO: fill this in! */ }

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: UserPageTitle }} />
    <UsersSingle />
  </>;
}
