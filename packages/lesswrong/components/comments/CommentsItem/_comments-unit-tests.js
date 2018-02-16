import React from 'react';
import { shallow, configure } from 'enzyme';
import { expect } from 'meteor/practicalmeteor:chai';
import CommentsItem from './CommentsItem.jsx'
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() })
import { Components } from 'meteor/vulcan:core';

export const commentMockProps = {
  router: {params:""},
  comment: {_id:"", user:{username:""}},
  post:{_id:"",slug:""},
}

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
});
