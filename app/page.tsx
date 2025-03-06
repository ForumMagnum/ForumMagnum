"use client"

import LWHomeComponent from '@/components/common/LWHome';
import '../pages/api/reactFactoryShim'
import TopPostsPage from "@/components/sequences/TopPostsPage";
import Link from 'next/link';
import { Suspense } from 'react';
export default function Home() {
  return (<>
    <Suspense fallback={<div>Loading TopPostsPage in root...</div>}>
      <LWHomeComponent />
    </Suspense>
    <Link href="/test"><strong>Go Test</strong></Link>
    <div>
      <p>
        sadsadsadsdsa
      </p>
    </div>
  </>
  );
}
