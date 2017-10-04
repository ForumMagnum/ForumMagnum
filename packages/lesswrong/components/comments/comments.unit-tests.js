import { Components } from 'meteor/vulcan:core';
import React from 'react';
import { render, shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { chai } from 'meteor/practicalmeteor:chai';
import CommentsItem from './CommentsItem.jsx'

import { withRouter } from 'react-router'
import { sinon } from 'meteor/practicalmeteor:sinon';

const willMount = sinon.spy();
const didMount = sinon.spy();
const willUnmount = sinon.spy();

const assert = chai.assert;
const should = chai.should;
const expect = chai.expect;

configure({ adapter: new Adapter() })

const mockProps = {
  router: {params:""},
  comment: {_id:""}
}

describe('CommentsItem', () => {
  it('should render reply-button when logged in', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...mockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('should NOT render reply-button when NOT logged in', () => {
    const commentsItem = shallow(<CommentsItem {...mockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('clicking "reply" calls showReply method', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}}  {...mockProps} />)
    const instance = commentsItem.instance()
    const spy = sinon.stub(instance, 'showReply', () => { })
    instance.forceUpdate()
    commentsItem.update()
    commentsItem.find('.comments-item-reply-link').simulate('click')
    expect(spy.called).to.equal(true)
  });
});
