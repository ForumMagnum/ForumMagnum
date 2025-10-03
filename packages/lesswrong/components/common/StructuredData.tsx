import React from 'react';
import { toEmbeddableJson } from '@/lib/utils/jsonUtils';
import DeferRender from './DeferRender';

const StructuredDataInner = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toEmbeddableJson(generate()) }} />;
}

export const StructuredData = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  return <DeferRender ssr={false}>
    <StructuredDataInner generate={generate} />
  </DeferRender>;
}
