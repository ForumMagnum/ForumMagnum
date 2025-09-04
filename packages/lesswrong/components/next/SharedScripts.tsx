'use client';
import React from 'react';

import { getEmbeddedStyleLoaderScript } from "@/components/hooks/embedStyles";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { getInstanceSettings } from "@/lib/getInstanceSettings";

// These exist as a client component to avoid the RSC rehydration protocol
// putting them into the initial streamed response chunk twice.
export const SharedScripts = () => {
  const { public: publicInstanceSettings } = getInstanceSettings();
  return (<>
      <script dangerouslySetInnerHTML={{__html: `window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}}/>
      <script dangerouslySetInnerHTML={{__html: getEmbeddedStyleLoaderScript()}}/>
  </>)
};
