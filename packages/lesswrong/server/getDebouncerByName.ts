import keyBy from "lodash/keyBy";
import { EventDebouncer } from "./debouncer";
import { notificationDebouncers } from "./notificationBatching";
import { curationEmailDelayDebouncer } from "./callbacks/postCallbackFunctions";
import { welcomeMessageDelayer } from "./callbacks/userCallbackFunctions";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

let eventDebouncersByName: Partial<Record<string,EventDebouncer<any>>>|null = null;

export function getDebouncerByName(name: string) {
  if (!eventDebouncersByName) {
    eventDebouncersByName = keyBy([
      ...filterNonnull(Object.values(notificationDebouncers)),
      curationEmailDelayDebouncer,
      welcomeMessageDelayer,
    ], d=>d.name);
  }
  return eventDebouncersByName[name];
}
