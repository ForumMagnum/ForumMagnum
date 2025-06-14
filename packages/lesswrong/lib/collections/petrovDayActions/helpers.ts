import { STARTING_MINUTE } from './constants';

export const inWarningWindow = (currentMinute: number) => {
  return currentMinute >= STARTING_MINUTE || currentMinute < 17;
};
