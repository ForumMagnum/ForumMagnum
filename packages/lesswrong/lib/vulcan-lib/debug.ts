import { PublicInstanceSetting } from '../instanceSettings';

const debugSetting = new PublicInstanceSetting<boolean>('debug', false, "optional") // Enable debug mode (more verbose logging)

export const debug: any = function () {
  if (debugSetting.get()) {
    // eslint-disable-next-line no-console
    console.log.apply(null, arguments);
  }
};

export const debugGroup: any = function () {
  if (debugSetting.get()) {
    // eslint-disable-next-line no-console
    console.groupCollapsed.apply(null, arguments);
  }
};
export const debugGroupEnd: any = function () {
  if (debugSetting.get()) {
    // eslint-disable-next-line no-console
    console.groupEnd.apply(null, arguments);
  }
};
