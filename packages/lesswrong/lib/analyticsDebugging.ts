import { showAnalyticsDebug } from './publicSettings';
import { isAnyTest, isDevelopment } from './executionEnvironment';
import { getPublicSettingsLoaded } from './settingsCache';


export function getShowAnalyticsDebug() {
  if (isAnyTest)
    return false;
  const debug = getPublicSettingsLoaded() ? showAnalyticsDebug.get() : "dev";
  if (debug === "always")
    return true;
  else if (debug === "dev")
    return isDevelopment;

  else
    return false;
}
