import { useContext } from 'react';
import { SSRResponseContext } from './Helmet';

export const StructuredData = ({generate}: {
  generate: () => Record<string,AnyBecauseHard>
}) => {
  const { setStructuredData } = useContext(SSRResponseContext);
  setStructuredData(generate);
  return null;
}
