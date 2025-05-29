import React from 'react';
import { toEmbeddableJson } from '@/lib/utils/jsonUtils';

export const StructuredData = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  // TODO: Move this from inline-wherever to the end of the page
  return <>
    {/* See https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data */}
    <script type="application/ld+json">
      {toEmbeddableJson(generate())}
    </script>
  </>
}
