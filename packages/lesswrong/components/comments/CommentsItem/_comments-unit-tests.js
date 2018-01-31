import React from 'react';
import { render, shallow, mount, configure } from 'enzyme';
import { assert, should, expect } from 'meteor/practicalmeteor:chai';
import CommentsItem from './CommentsItem.jsx'
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() })

import { sinon } from 'meteor/practicalmeteor:sinon';

const mockProps = {
  router: {params:""},
  comment: {_id:""}
}

describe('CommentsItem', () => {
  it('renders reply-button when logged in', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...mockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('does NOT render reply-button when NOT logged in', () => {
    const commentsItem = shallow(<CommentsItem {...mockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('renders Subscribe menu item by default', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...mockProps} />)
    expect(commentsItem.find(".comment-menu-item-subscribe")).to.have.length(1);
  });
  it('renders Report menu item by default', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...mockProps} />)
    expect(commentsItem.find(".comment-menu-item-report")).to.have.length(1);
  });
  // it('clicking "reply" calls showReply method', () => {
  //   const commentsItem = shallow(<CommentsItem currentUser={{}}  {...mockProps} />)
  //   const instance = commentsItem.instance()
  //   const spy = sinon.stub(instance, 'showReply', () => { })
  //   instance.forceUpdate()
  //   commentsItem.update()
  //   commentsItem.find('.comments-item-reply-link').simulate('click')
  //   expect(spy.called).to.equal(true)
  // });
});
