'use client';
import React, { useMemo } from 'react';

import { getEmbeddedStyleLoaderScript } from "@/components/hooks/embedStyles";
import { toEmbeddableJson } from "@/lib/utils/jsonUtils";
import { getInstanceSettings } from "@/lib/getInstanceSettings";
import { globalExternalStylesheets } from "@/themes/globalStyles/externalStyles";
import { faviconUrlSetting } from '@/lib/instanceSettings';

// These exist as a client component to avoid the RSC rehydration protocol
// putting them into the initial streamed response chunk twice.
const SharedScriptsInner = ({ isReturningVisitor }: { isReturningVisitor: boolean }) => {
  const { public: publicInstanceSettings } = getInstanceSettings();
  return (<>
      {globalExternalStylesheets.map(stylesheet => <link key={stylesheet} rel="stylesheet" type="text/css" href={stylesheet}/>)}
      <script dangerouslySetInnerHTML={{__html: `window.publicInstanceSettings = ${toEmbeddableJson(publicInstanceSettings)}`}}/>
      <script dangerouslySetInnerHTML={{__html: getEmbeddedStyleLoaderScript()}}/>
      <script dangerouslySetInnerHTML={{__html: `window.isReturningVisitor = ${toEmbeddableJson(isReturningVisitor)}`}}/>
      
      <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />
      <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
      {/* HACK: These insertion-point markers are <script> tags (rather than
        * <style> tags) because <style> is special-cased in a way that
        * interacts badly with our dynamic insertion leading to a hydration
        * mismatch */}
      <script id="jss-insertion-start"/>
      {/*Style tags are dynamically inserted here*/}
      <script id="jss-insertion-end"/>
      <link rel="icon" href={faviconUrlSetting.get()}/>
  </>)
};

export const SharedScripts = ({ isReturningVisitor }: { isReturningVisitor: boolean }) => {
  return useMemo(() => <SharedScriptsInner isReturningVisitor={isReturningVisitor}/>, [isReturningVisitor]);
}
