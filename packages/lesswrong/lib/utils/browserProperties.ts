import bowser from "bowser";
import { Meteor } from 'meteor/meteor';

export const browserProperties = () => {
    if (Meteor.isClient &&
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
