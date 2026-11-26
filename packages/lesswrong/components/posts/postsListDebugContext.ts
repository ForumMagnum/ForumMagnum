import { createContext } from 'react';
import type { FilterSettings } from '@/lib/filterSettings';
import { defaultActivityHalfLife } from '@/lib/instanceSettings';
import { ACTIVITY_WINDOW_HOURS, calculateActivityFactor } from '@/lib/collections/useractivities/utils';

interface SimulatedVisitorScenario {
  label: string
  visitIntervalHours: number|null
}

const simulatedVisitorScenarios = {
  firstTime: { label: "First-time visitor", visitIntervalHours: null },
  occasional: { label: "Occasional visitor (weekly)", visitIntervalHours: 7 * 24 },
  frequent: { label: "Frequent visitor (daily)", visitIntervalHours: 24 },
} satisfies Record<string, SimulatedVisitorScenario>;

export type VisitorScenario = "actual" | keyof typeof simulatedVisitorScenarios;

export const visitorScenarioOptions: { value: VisitorScenario, label: string }[] = [
  { value: "actual", label: "Default (your actual visit history)" },
  { value: "firstTime", label: simulatedVisitorScenarios.firstTime.label },
  { value: "occasional", label: simulatedVisitorScenarios.occasional.label },
  { value: "frequent", label: simulatedVisitorScenarios.frequent.label },
];

function getSimulatedActivityArray(visitIntervalHours: number|null): number[] {
  return Array.from({ length: ACTIVITY_WINDOW_HOURS }, (_, hour) =>
    (visitIntervalHours !== null && hour % visitIntervalHours === 0) ? 1 : 0
  );
}

export function getVisitorScenarioActivityFactor(scenario: VisitorScenario): number|undefined {
  if (scenario === "actual") {
    return undefined;
  }
  const { visitIntervalHours } = simulatedVisitorScenarios[scenario];
  return calculateActivityFactor(getSimulatedActivityArray(visitIntervalHours), defaultActivityHalfLife);
}

export interface PostsListDebugSettings {
  filterSettings: FilterSettings
  scenario: VisitorScenario
  activityFactorOverride: number|undefined
}

export const PostsListDebugContext = createContext<PostsListDebugSettings|null>(null);
