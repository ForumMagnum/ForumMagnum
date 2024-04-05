import { useLoadedLibrary } from './useLoadedLibrary';
import type { WrappedReCharts } from './recharts';

export function useReCharts(): {
  ready: true,
  recharts: WrappedReCharts,
} | {
  ready: false,
  recharts: null,
}{
  const result = useLoadedLibrary<WrappedReCharts>({
    path: "/js/recharts.js",
    windowField: "recharts",
  });
  if (result.ready) {
    return { ready: true, recharts: result.library };
  } else {
    return { ready: false, recharts: null };
  }
}
