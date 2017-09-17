/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';
import Posts from "meteor/nova:posts";
import React from 'react';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';

describe('Users signup/login', function () {
    it('check ending after loadmore()', function () {
        let results = [{}, {}, {}, {}, {}, {}, {}, {}],// 8
          hasMore = true,
          ready = false,
          totalCount = 15,
          limit = 12,
          firstPagination = true;
        const showReady = Posts.showReady(results, hasMore, ready, totalCount, limit, firstPagination);
        chai.assert.equal(showReady, false);
    });
});