import bowser from "bowser";
import { isClient } from '../executionEnvironment';

export const browserProperties = (): {} => {
  if (!isClient) return {};
  
  const userAgentInfo = (window?.navigator?.userAgent) ? {
    // detect: bowser.detect(),
    userAgent: window?.navigator?.userAgent,
    mobile: bowser.mobile,
    tablet: bowser.tablet,
    chrome: bowser.chrome,
    firefox: bowser.firefox,
    safari: bowser.safari,
    osname: bowser.osname
  } : {};
  
  const W = (window as any);
  const blocks = W ? {
    blocksGA: !(W.ga?.create),
    blocksGTM: !(W.google_tag_manager),
  } : {};
  
  return {
    ...userAgentInfo,
    ...blocks,
  };
}
