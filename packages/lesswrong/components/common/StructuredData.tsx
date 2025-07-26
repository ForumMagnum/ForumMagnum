import { toEmbeddableJson } from '@/lib/utils/jsonUtils';
import { SuspenseWrapper } from './SuspenseWrapper';

const StructuredDataInner = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toEmbeddableJson(generate()) }} />;
}

export const StructuredData = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  return <SuspenseWrapper name="StructuredData">
    <StructuredDataInner generate={generate} />
  </SuspenseWrapper>;
}
