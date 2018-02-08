import React from 'react';
import { render, shallow, mount, configure } from 'enzyme';
import { assert, should, expect } from 'meteor/practicalmeteor:chai';
import CommentsItem from './CommentsItem.jsx'
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() })
import { Components } from 'meteor/vulcan:core';
import {Provider} from 'react-redux'

import configureStore from 'redux-mock-store'
import { sinon } from 'meteor/practicalmeteor:sinon';

export const commentMockProps = {
  router: {params:""},
  comment: {_id:"", user:{username:""}},
  post:{_id:"",slug:""},
  postEditMutation:()=>{},
  userEditMutation:()=>{},
}

const mockStore = configureStore()()

describe('CommentsItem', () => {
  it('renders reply-button when logged in', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...commentMockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('does NOT render reply-button when NOT logged in', () => {
    const commentsItem = shallow(<CommentsItem {...commentMockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('renders Subscribe menu item by default', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...commentMockProps} />)
    expect(commentsItem.find(".comment-menu-item-subscribe")).to.have.length(1);
  });
  it('renders Report menu item by default', () => {
    const commentsItem = shallow(<CommentsItem currentUser={{}} {...commentMockProps} />)
    expect(commentsItem.find(".comment-menu-item-report")).to.have.length(1);
  });
  // it('renders BanUserFromPostMenuItem component', () => {
  //   const commentsItem = render(
  //     <Provider store={mockStore}>
  //       <CommentsItem currentUser={{}} {...commentMockProps} />
  //     </Provider>
  //   )
  //   expect(commentsItem.find(".comment-menu-item-ban-from-user")).to.have.length(1);
  // });
  // it('clicking "reply" calls showReply method', () => {
  //   const commentsItem = shallow(<CommentsItem currentUser={{}}  {...commentMockProps} />)
  //   const instance = commentsItem.instance()
  //   const spy = sinon.stub(instance, 'showReply', () => { })
  //   instance.forceUpdate()
  //   commentsItem.update()
  //   commentsItem.find('.comments-item-reply-link').simulate('click')
  //   expect(spy.called).to.equal(true)
  // });
});
