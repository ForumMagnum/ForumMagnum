import React from 'react';
import { shallow, configure } from 'enzyme';
import { expect } from 'meteor/practicalmeteor:chai';

import commentMockProps from '../../components/comments/CommentsItem/_comments-unit-tests.js'

import CommentsItem from '../../components/comments/CommentsItem/CommentsItem.jsx'
import CommentsListSection from '../../components/comments/CommentsListSection.jsx'

import { Components } from 'meteor/vulcan:core';

import Adapter from 'enzyme-adapter-react-16';
import ApolloClient from 'apollo-client';

import { createDummyUser, createDummyPost } from '../utils.js'

configure({ adapter: new Adapter() })

const mockClient = new ApolloClient()

const commentListMockProps = {
  store: {},
  router: { location: {query:()=>{}}, push: ()=>{}}
}

describe('Commenting while banned from post --', async () => {
  it('CommentsItem does NOT render reply-button when user is in a Post bannedUserIds list', async () => {
    const user = await createDummyUser()
    const author = await createDummyUser({groups:['trustLevel1']})
    const post = await createDummyPost(author, {bannedUserIds:[user._id]})
    const commentsItem = shallow(
      <CommentsItem
        {...commentMockProps.commentMockProps}
        currentUser={user}
        post={post}
      />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('CommentsItem renders reply-button when user is in a Post bannedUserIds list but PostAuthor NOT in trustLevel1', async () => {
    const user = await createDummyUser()
    const author = await createDummyUser()
    const post = await createDummyPost(author, {bannedUserIds:[user._id]})

    const commentsItem = shallow(
      <CommentsItem
        {...commentMockProps.commentMockProps}
        currentUser={user}
        post={post}
      />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('CommentsItem does NOT render reply-button when user is in a User bannedUserIds list', async () => {
    const user = await createDummyUser()
    const author = await createDummyUser({groups:['trustLevel1'], bannedUserIds:[user._id]})
    const post = await createDummyPost(author)
    const commentsItem = shallow(
      <CommentsItem
        {...commentMockProps.commentMockProps}
        currentUser={user}
        post={post}
      />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
  });
  it('CommentsItem renders reply-button when user is in Post bannedUserIds list but User is NOT in trustLevel1', async () => {
    const user = await createDummyUser()
    const author = await createDummyUser({bannedUserIds:[user._id]})
    const post = await createDummyPost(author)

    const commentsItem = shallow(
      <CommentsItem
        {...commentMockProps.commentMockProps}
        currentUser={user}
        post={post}
      />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('commentsListSection renders new-comment-form when user is NOT in a Post bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"1234"}}
        post={{id:"",slug:"", bannedUserIds:[], user:{groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(1);
    const commentsListSection2 = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"12345"}}
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
        currentUser={{_id:"12345"}}
        post={{bannedUserIds:["12345"], user:{groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(0);
  });
  it('commentsListSection renders new-comment-form when user is NOT in a User bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"12346"}}
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
        currentUser={{_id:"4321"}}
        post={{user:{bannedUserIds:["4321"], groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".posts-comments-thread-new")).to.have.length(0);
  });
  it('commentsListSection does NOT render banned_message when user is NOT in a User bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"4321"}}
        post={{user:{bannedUserIds:["not4321"], groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".author_has_banned_you")).to.have.length(0);
  });
  it('commentsListSection does NOT render banned_message when user is not logged in', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{}}
        post={{user:{bannedUserIds:["not4321"], groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".author_has_banned_you")).to.have.length(0);
  });
  it('commentsListSection renders banned_message when user is in a User bannedUserIds list', () => {
    const commentsListSection = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"4321"}}
        post={{user:{bannedUserIds:["4321"], groups:['trustLevel1']}}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection.find(".author_has_banned_you")).to.have.length(1);
  });
});

describe('BanUserFromPostMenuItem --', () => {
  it('renders if user is in trustLevel1, owns the post, and has set their moderationStyle field', () => {
    const testUser = { _id: "12347", groups:['trustLevel1']}
    const testPost = { userId: "12347", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(1);
  });
  it('does NOT render if user is in trustLevel1, owns the post, but has NOT set their moderationStyle field', () => {
    const testUser = { _id: "12348", groups:['trustLevel1']}
    const testPost = { userId: "12348", user: { moderationStyle: null }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
  it('does NOT render if user is in trustLevel1, has set their moderationStyle field, but does NOT own post', () => {
    const testUser = { _id: "1234", groups:['trustLevel1']}
    const testPost = { userId: "not1234", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
  it('renders if user owns the post, has set their moderationStyle field, but is NOT in trustLevel1', () => {
    const testUser = { _id: "12348", groups:[]}
    const testPost = { userId: "12348", user: { moderationStyle: "Reign of Terror" }}
    const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
    expect(banUserMenuItem.find(".comment-menu-item-ban-from-post")).to.have.length(0);
  });
});

describe('Comment Delete menu item --', () => {
  it('renders if user is an admin', () => {
    const testUser = {
      isAdmin:true
    }
    const commentsItem = shallow(<CommentsItem {...commentMockProps.commentMockProps} currentUser={testUser} />)
    expect(commentsItem.find(".comment-menu-item-delete")).to.have.length(1);
  });
  it("doesn't render if user not is an admin", () => {
    const commentsItem = shallow(<CommentsItem {...commentMockProps.commentMockProps} currentUser={{}} />)
    expect(commentsItem.find(".comment-menu-item-delete")).to.have.length(0);
  });
});
