/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';
import Users from 'meteor/nova:users';
import React from 'react';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';

describe('Users signup/login', function () {
    it('User signup via email', function () {
        const wrapper = mount(<Telescope.components.SubmitAnArticle />);
        let calledOnce = Telescope.components.SubmitAnArticle.prototype.componentDidMount.calledOnce;
        //chai.assert.equal(calledOnce, true);
    });

    it("User's popup menu", function () {
        const menus = Users.getPopoverMenuArray({telescope: {slug: "test"}}, true);
        debugger
    });
});