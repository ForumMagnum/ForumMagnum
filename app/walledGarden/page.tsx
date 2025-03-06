"use client";

import WalledGardenHome from '@/components/walledGarden/WalledGardenHome';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>Walled Garden</title></Helmet>
      <WalledGardenHome />
    </>
  );
}
