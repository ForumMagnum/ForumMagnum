/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';
import Users from "meteor/nova:users";

import Telescope from 'meteor/nova:lib';
import moment from 'moment';

describe('Developing functions', function () {
    it('token.expires', function () {
        let REFERENCE = moment(new Date()); // today
        const lastWeek = REFERENCE.clone().subtract(7, 'days').startOf('day');

        chai.assert.equal(Users.checkTokenExpires(lastWeek.toISOString(), {days: 2}), false);
        chai.assert.equal(Users.checkTokenExpires(lastWeek.toISOString(), {days: 10}), true);
    })
});