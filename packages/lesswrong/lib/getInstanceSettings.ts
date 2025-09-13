// Will be null instead of a function (from the stubs directory) if not on the server
import { getSettings } from "@/server/settings/settings";
import { isServer } from "./executionEnvironment";

export const getInstanceSettings = () => {
  if (isServer) {
    return getSettings();
  } else {
    return {
      public: window.publicInstanceSettings,
      private: undefined,
    };
  }
}
