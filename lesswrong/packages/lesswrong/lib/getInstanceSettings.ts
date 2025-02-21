// Will be null instead of a function (from the stubs directory) if not on the server
// import { CommandLineArguments, loadInstanceSettings } from "@/server/commandLine";

let instanceSettings: any = null;
export const getInstanceSettings = (args?: any): any => {
  if (!instanceSettings) {
    if (bundleIsServer) {
      instanceSettings = {}
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
