import { useLocation } from '@/lib/routeUtil';

export const useIsOnGrayBackground = () => {
  const { currentRoute } = useLocation();
  return currentRoute?.background !== "white";
}
