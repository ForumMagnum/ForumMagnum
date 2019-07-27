import React from 'react';
import { withMutation } from 'meteor/vulcan:core';
import compose from 'recompose/compose';
import withNewEvents from '../../lib/events/withNewEvents.jsx';

export const PostsReadContext = React.createContext('postsViewed');

// HoC which adds recordPostView and isRead properties to a component which
// already has a post property.
export const withRecordPostView = (Component) => {
  const recordPostView = ({post, postsRead, setPostRead, increasePostViewCount, currentUser, recordEvent}) => async ({extraEventProperties}) => {
    try {
      if (!post) throw new Error("Tried to record view of null post");
      
      // a post id has been found & it's has not been seen yet on this client session
      if (post && !postsRead[post._id]) {

        // Trigger the asynchronous mutation with postId as an argument
        // Deliberately not awaiting, because this should be fire-and-forget
        await increasePostViewCount({postId: post._id});

        // Update the client-side read status cache
        setPostRead(post._id, true);
      }

      // Register page-visit event
      if(currentUser) {
        let eventProperties = {
          userId: currentUser._id,
          important: false,
          intercom: true,
          ...extraEventProperties
        };

        eventProperties = {
          ...eventProperties,
          documentId: post._id,
          postTitle: post.title,
        };
        recordEvent('post-view', true, eventProperties);
      }
    } catch(error) {
      console.log("recordPostView error:", error); // eslint-disable-line
    }
  }
  
  function ComponentWithRecordPostView(props) {
    return (<PostsReadContext.Consumer>
      { (postsReadContext) => {
        const {postsRead,setPostRead} = postsReadContext;
        const {post, increasePostViewCount, currentUser, recordEvent} = props;
        return <Component
          {...props}
          recordPostView={recordPostView({post, postsRead, setPostRead, increasePostViewCount, currentUser, recordEvent})}
          isRead={post && ((post._id in postsRead)
              ? postsRead[post._id]
              : post.isRead)
          }
        />
      }}
    </PostsReadContext.Consumer>);
  }
  
  return compose(
    withMutation({
      name: 'increasePostViewCount',
      args: {postId: 'String'},
    }),
    withNewEvents,
  )(ComponentWithRecordPostView);
}

export default withRecordPostView;
