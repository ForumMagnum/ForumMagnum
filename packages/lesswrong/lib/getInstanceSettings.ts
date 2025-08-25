// Will be null instead of a function (from the stubs directory) if not on the server
import { getSettings } from "@/server/settings/settings";
import { isServer } from "./executionEnvironment";

let instanceSettings: any = null;
export const getInstanceSettings = (): any => {
  if (!instanceSettings) {
    if (isServer) {
      instanceSettings = getSettings();
    } else {
      instanceSettings = {
        public: window.publicInstanceSettings,
      };
    }
  }
  return instanceSettings;
}
export const setInstanceSettings = (settings: any) => {
  instanceSettings = settings;
}
