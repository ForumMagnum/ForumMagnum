import bowser from "bowser";
import { isClient } from '../executionEnvironment';

export const browserProperties = () => {
    if (isClient &&
        window &&
        window.navigator &&
        window.navigator.userAgent) {

        return {
            // detect: bowser.detect(),
            mobile: bowser.mobile,
            tablet: bowser.tablet,
            chrome: bowser.chrome,
            firefox: bowser.firefox,
            safari: bowser.safari,
            osname: bowser.osname
        }
    }
    return false
}
