"use client";
export const dynamic = 'force-dynamic';
import Codex from '@/components/sequences/Codex';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>The Codex</title></Helmet>
      <Codex />
    </>
  );
}
