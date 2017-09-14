/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';

describe('Web app base library', function () {
    it('lib contains some functions that should be tested', function () {
        // This code will be executed by the test driver when the app is started
        // in the correct mode


    });

    it('Settings functions that should be tested', function () {
        // This code will be executed by the test driver when the app is started
        // in the correct mode

        chai.assert.equal(Telescope.settings.get("title"), "Politicl – Knowledge is Power");
    })

});