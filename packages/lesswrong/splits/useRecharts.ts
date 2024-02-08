import { useLoadedLibrary } from './useLoadedLibrary';

type ReCharts = any;

export function useReCharts(): {
  ready: boolean,
  recharts: ReCharts,
} {
  const result = useLoadedLibrary<ReCharts>({
    path: "/js/recharts.js",
    windowField: "recharts",
  });
  return { ready: result.ready, recharts: result.ready ? result.library : null };
}
