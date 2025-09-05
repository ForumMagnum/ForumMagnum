'use client';
import React from 'react';

import { getEmbeddedStyleLoaderScript } from "@/components/hooks/embedStyles";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import { globalExternalStylesheets } from "@/themes/globalStyles/externalStyles";

// These exist as a client component to avoid the RSC rehydration protocol
// putting them into the initial streamed response chunk twice.
export const SharedScripts = () => {
  const { public: publicInstanceSettings } = getInstanceSettings();
  return (<>
      {globalExternalStylesheets.map(stylesheet => <link key={stylesheet} rel="stylesheet" type="text/css" href={stylesheet}/>)}
      <script dangerouslySetInnerHTML={{__html: `window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}}/>
      <script dangerouslySetInnerHTML={{__html: getEmbeddedStyleLoaderScript()}}/>
      <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />
      {/* HACK: These insertion-point markers are <script> tags (rather than
        * <style> tags) because <style> is special-cased in a way that
        * interacts badly with our dynamic insertion leading to a hydration
        * mismatch */}
      <script id="jss-insertion-start"/>
      {/*Style tags are dynamically inserted here*/}
      <script id="jss-insertion-end"/>
  </>)
};
