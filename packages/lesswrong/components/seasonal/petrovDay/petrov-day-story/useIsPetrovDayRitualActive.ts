import { useCurrentTime } from '@/lib/utils/timeUtil';

// The ritual is live for as long as it is September 26 anywhere in the world:
// from midnight at UTC+14 (Line Islands) until midnight at UTC-12 (Baker Island).
export const PETROV_DAY_RITUAL_START = new Date('2026-09-26T00:00:00+14:00');
export const PETROV_DAY_RITUAL_END = new Date('2026-09-27T00:00:00-12:00');

export const isPetrovDayRitualActive = (now: Date): boolean => {
  return now >= PETROV_DAY_RITUAL_START && now < PETROV_DAY_RITUAL_END;
}

export function useIsPetrovDayRitualActive(): boolean {
  const now = useCurrentTime();
  return isPetrovDayRitualActive(now);
}
