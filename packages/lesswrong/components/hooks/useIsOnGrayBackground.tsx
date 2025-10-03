import { useRouteMetadata } from '../ClientRouteMetadataContext';

export const useIsOnGrayBackground = () => {
  const { metadata } = useRouteMetadata();
  return metadata.background !== "white";
}
