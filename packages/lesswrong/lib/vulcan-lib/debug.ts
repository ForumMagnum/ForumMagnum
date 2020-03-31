import { getSetting } from './settings';

export const debug: any = function () {
  if (getSetting('debug', false)) {
    // eslint-disable-next-line no-console
    console.log.apply(null, arguments);
  }
};

export const debugGroup: any = function () {
  if (getSetting('debug', false)) {
    // eslint-disable-next-line no-console
    console.groupCollapsed.apply(null, arguments);
  }
};
export const debugGroupEnd: any = function () {
  if (getSetting('debug', false)) {
    // eslint-disable-next-line no-console
    console.groupEnd.apply(null, arguments);
  }
};
