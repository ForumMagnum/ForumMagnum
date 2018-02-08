import React from 'react';
import { shallow, configure } from 'enzyme';
import { expect } from 'meteor/practicalmeteor:chai';

import commentMockProps from '../../components/comments/CommentsItem/_comments-unit-tests.js'

import CommentsItem from '../../components/comments/CommentsItem/CommentsItem.jsx'
import BanUserFromPostMenuItem from '../../components/comments/CommentsItem/BanUserFromPostMenuItem.jsx'
import BanUserFromAllPostsMenuItem from '../../components/comments/CommentsItem/BanUserFromAllPostsMenuItem.jsx'
import CommentsListSection from '../../components/comments/CommentsListSection.jsx'

import { Components } from 'meteor/vulcan:core';

import Adapter from 'enzyme-adapter-react-16';
import ApolloClient from 'apollo-client';

configure({ adapter: new Adapter() })

const mockClient = new ApolloClient()

const commentListMockProps = {
  store: {},
  router: { location: {query:()=>{}}, push: ()=>{}}
}

describe('Creating comments while banned from post', () => {
  it('CommentsItem does NOT render reply-button when user is in a Post bannedUserIds list', () => {
    const commentsItem = shallow(<Components.CommentsItem currentUser={{_id:"test"}} post={{bannedUserIds:["test"]}} {...commentMockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('commentsListSection renders new-comment-form when user is NOT in a Post bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{id:"",slug:"", bannedUserIds:[]}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(1);
    const commentsListSection2 = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{id:"",slug:""}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection2.find(".posts-comments-thread-new")).to.have.length(1);
  });
  it('commentsListSection does NOT render new-comment-form when user is in a Post bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{bannedUserIds:["1234"]}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(0);
  });
  it('commentsListSection renders new-comment-form when user is NOT in a User bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{user:{bannedUserIds:[]}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(1);
  });
  it('commentsListSection does NOT render new-comment-form when user is in a User bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{user:{bannedUserIds:["1234"]}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(0);
  });
});

describe('BanUserFromPostMenuItem', () => {
  it('renders if user is in trustLevel1, owns the post, and has set their moderationStyle field', () => {
    const testUser = { _id: "1234", groups:['trustLevel1']}
    const testPost = { userId: "1234", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(1);
  });
  it('does NOT render if user is in trustLevel1, owns the post, but has NOT set their moderationStyle field', () => {
    const testUser = { _id: "1234", groups:['trustLevel1']}
    const testPost = { userId: "1234", user: { moderationStyle: null }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
  it('does NOT render if user is in trustLevel1, has set their moderationStyle field, but does NOT own post', () => {
    const testUser = { _id: "1235", groups:['trustLevel1']}
    const testPost = { userId: "1234", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
  it('renders if user owns the post, has set their moderationStyle field, but is NOT in trustLevel1', () => {
    const testUser = { _id: "1234", groups:[]}
    const testPost = { userId: "1234", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
});

describe('Comment Delete menu item', () => {
  it('renders if user is an admin', () => {
    const testUser = {
      isAdmin:true
    }
    const commentsItem = shallow(<Components.CommentsItem currentUser={testUser} {...commentMockProps} />)
    expect(commentsItem.find(".comment-menu-item-delete")).to.have.length(1);
  });
  it("doesn't render if user not is an admin", () => {
    const commentsItem = shallow(<Components.CommentsItem currentUser={{}} {...commentMockProps} />)
    expect(commentsItem.find(".comment-menu-item-delete")).to.have.length(0);
  });
});
