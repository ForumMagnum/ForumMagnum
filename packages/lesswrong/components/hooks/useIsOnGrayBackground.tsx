import { useRouteMetadata } from '@/components/layout/ClientRouteMetadataContext';

export const useIsOnGrayBackground = () => {
  const { metadata } = useRouteMetadata();
  return metadata.background !== "white";
}
