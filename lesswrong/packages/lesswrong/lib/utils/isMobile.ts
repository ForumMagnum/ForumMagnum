import bowser from 'bowser'
import { isClient } from '../executionEnvironment';

/**
 * Returns whether this is a mobile device (according to heuristics in the
 * bowser library). Only usable on the client. Do NOT use this inside a
 * component function outside of an event handler, since that will create
 * an SSR mismatch. If you're thinking of using this to change layout/
 * presentation, this is probably not what you want; use CSS breakpoints
 * instead.
 */
export const isMobile = () => {
  return isClient
    && window?.navigator?.userAgent
    && (bowser.mobile || bowser.tablet);
}
