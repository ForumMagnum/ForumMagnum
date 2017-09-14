/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';
import Posts from "meteor/nova:posts";
import React from 'react';
import moment from 'moment';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';

describe('Moment DateTime', function () {

    // Issue #120
    // beyond:[01/03/2017]
    it('A user should not be able to go beyond 1st March or whenever our website gets launched.', function () {
        chai.assert.equal(moment("2017-02-01").isBefore(moment("2017-03-01")), true);
        chai.assert.equal(moment("2017-03-01").isBefore(moment("2017-03-01")), false);
        chai.assert.equal(moment("2017-04-01").isBefore(moment("2017-03-01")), false);
    });
});