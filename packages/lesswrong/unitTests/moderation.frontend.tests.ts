import { stubbedTests } from './stubbedTests';

stubbedTests();

// Commented out because these unit tests were based on a very brittle hack:
// mocking Apollo with no backend. Under Apollo 2, you can't create an
// ApolloClient without a link, so that doesn't work at all.
/*
import React from 'react';
import { shallow, configure } from 'enzyme';
import { expect } from 'meteor/practicalmeteor:chai';

import commentMockProps from '../../components/comments/CommentsItem/_comments-unit-tests.js'

import CommentsItem from '../../components/comments/CommentsItem/CommentsItem.jsx'
import CommentsListSection from '../../components/comments/CommentsListSection.jsx'

import Adapter from 'enzyme-adapter-react-16';
import ApolloClient from 'apollo-client';

import { createDummyUser, createDummyPost } from '../utils.js'

configure({ adapter: new Adapter() })

const mockClient = new ApolloClient()

const commentListMockProps = {
  store: {},
  router: { location: {query:()=>{}}, push: ()=>{}},
  classes: {}
}
*/

describe('Commenting while banned from post --', () => {
  /*
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
  it('CommentsItem does not render reply-button when user is in a Post bannedUserIds list but PostAuthor NOT in trustLevel1', async () => {
    const user = await createDummyUser()
    const author = await createDummyUser()
    const post = await createDummyPost(author, {bannedUserIds:[user._id]})

    const commentsItem = shallow(
      <CommentsItem
        {...commentMockProps.commentMockProps}
        currentUser={user}
        post={post}
      />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(0);
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
    expect(commentsListSection.find("#posts-thread-new-comment")).to.have.length(1);
    const commentsListSection2 = shallow(
      <CommentsListSection
        { ...commentListMockProps}
        currentUser={{_id:"12345"}}
        post={{id:"",slug:""}}
      />,
      {context:{client:mockClient}}
    )
    expect(commentsListSection2.find("#posts-thread-new-comment")).to.have.length(1);
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
    expect(commentsListSection.find("#posts-thread-new-comment")).to.have.length(0);
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
    expect(commentsListSection.find("#posts-thread-new-comment")).to.have.length(1);
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
    expect(commentsListSection.find("#posts-thread-new-comment")).to.have.length(0);
  });
  */
  
  // These tests are disabled because they were built on a brittle assumption
  // which no longer holds: that the relevant part of the resulting React tree
  // is present when only a shallow render is done (as opposed to a full
  // render). We can't do a full render in this context because we don't have
  // Apollo, and we also can't provide a user correctly without a full render
  // because shallow rendering can't do context variables.
  /*it('commentsListSection does NOT render banned_message when user is NOT in a User bannedUserIds list', () => {
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
  });*/
});

// describe('BanUserSubmenu --', () => {
//   it('renders if Users.canModeratePost returns true', () => {
//     TODO - stub Users.canModeratePost
//     const banUserMenuItem = shallow(<CommentsItem {...commentMockProps.commentMockProps} currentUser={testUser} />)
//     expect(banUserMenuItem.find(".comment-menu-item-ban-user-submenu")).to.have.length(1);
//   });
//   it('does not render if Users.canModeratePost returns false', () => {
//     TODO - stub Users.canModeratePost
//     const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
//     expect(banUserMenuItem.find(".comment-menu-item-ban-user-submenu")).to.have.length(0);
//   });
// });

// describe('DeleteCommentMenuItem --', () => {
//   it('renders if Users.canModeratePost returns true', () => {
//     TODO - stub Users.canModeratePost
//     const banUserMenuItem = shallow(<CommentsItem {...commentMockProps.commentMockProps} currentUser={testUser} />)
//     expect(banUserMenuItem.find(".comment-menu-item-ban-user-submenu")).to.have.length(1);
//   });
//   it('does not render if Users.canModeratePost returns false', () => {
//     TODO - stub Users.canModeratePost
//     const banUserMenuItem = shallow(<Components.BanUserFromPostMenuItem currentUser={testUser} comment={{}} post={testPost} />)
//     expect(banUserMenuItem.find(".comment-menu-item-ban-user-submenu")).to.have.length(0);
//   });
// });
