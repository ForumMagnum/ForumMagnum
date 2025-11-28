import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from '../layout/routeBackgroundColors';

export const useIsOnGrayBackground = () => {
  const pathname = usePrerenderablePathname();
  return !routeHasWhiteBackground(pathname);
}
