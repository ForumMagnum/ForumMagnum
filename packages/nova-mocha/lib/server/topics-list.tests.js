/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';
import Topics from "meteor/nova:topics";

describe('My Topics module', function () {
    it('does something that should be tested', function () {
        // This code will be executed by the test driver when the app is started
        // in the correct mode
        function done(error, result) {
            chai.assert.equal(error, null);
            chai.assert.equal(result.length, 15);
        }

        Meteor.call('topics.suggestions', 'ab', [], done);
    });

    it('Generate trending topics days', function () {
        // This code will be executed by the test driver when the app is started
        // in the correct mode
        const days = Topics.getTrendingTopicDays();
    })

});