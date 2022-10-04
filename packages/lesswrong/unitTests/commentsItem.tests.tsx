// STUBBED
// These unit tests were super brittle/broken because they use Enzyme shallow
// rendering rather than real rendering, and were made without all the
// infrastructure for setting up a proper React context for use in unit tests.
// If we make a better React component unit testing setup, maybe bring these
// back.
/*import React from 'react';
import { shallow, configure } from 'enzyme';
import { expect } from 'meteor/practicalmeteor:chai';
import { CommentsItem } from './CommentsItem'
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() })

export const commentMockProps = {
  router: {params:""},
  comment: {_id:"", user:{username:""}},
  post:{_id:"",slug:""},
  classes: {commentStyling:{}}
}

describe('CommentsItem', () => {
  const CommentsItemUntyped = (CommentsItem as any);
  it('renders reply-button when logged in', () => {
    const commentsItem = shallow(<CommentsItemUntyped currentUser={{}} {...commentMockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
  it('renders reply-button when NOT logged in', () => {
    const commentsItem = shallow(<CommentsItemUntyped {...commentMockProps} />)
    expect(commentsItem.find(".comments-item-reply-link")).to.have.length(1);
  });
});*/

import { stubbedTests } from "./stubbedTests";

stubbedTests();
