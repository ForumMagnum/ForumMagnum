import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from '../../lib/routeChecks/routeBackgroundColors';

export const useIsOnGrayBackground = () => {
  const pathname = usePrerenderablePathname();
  return !routeHasWhiteBackground(pathname);
}
