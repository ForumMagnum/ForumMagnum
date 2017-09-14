/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';

describe('Fixing the invalid uploaded Images', function () {
    it('does something that should be tested', function () {
        // This code will be executed by the test driver when the app is started
        // in the correct mode

        function done(error, result) {
            chai.assert.equal(error, null);
            //chai.assert.equal(result.length, 15);
        }

        Meteor.call('mimages.invalid.fix', ['fe70bc05-2444-4d5d-b032-24d577447534'], done);
    })
});