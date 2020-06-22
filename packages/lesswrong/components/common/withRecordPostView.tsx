import React, { useContext } from 'react';
import { withMutation } from '../../lib/crud/withMutation';
import { useCurrentUser } from './withUser';
import compose from 'recompose/compose';
import withNewEvents from '../../lib/events/withNewEvents';
import { hookToHoc } from '../../lib/hocUtils';

export type PostsReadContextType = {
  postsRead: Record<string,boolean>,
  setPostRead: (postId: string, isRead: boolean) => void,
};
export const PostsReadContext = React.createContext<PostsReadContextType|null>(null);
export const usePostsRead = (): PostsReadContextType => {
  const context = useContext(PostsReadContext);
  if (!context) throw new Error("usePostsRead called but not a descedent of Layout");
  return context;
}
export const withPostsRead = hookToHoc(usePostsRead);

// HoC which adds recordPostView and isRead properties to a component which
// already has a post property.
export const withRecordPostView = (Component) => {
  const recordPostView = ({post, postsRead, setPostRead, increasePostViewCount, currentUser, recordEvent}) => async ({extraEventProperties}) => {
    try {
      if (!post) throw new Error("Tried to record view of null post");
      
      // a post id has been found & it's has not been seen yet on this client session
      if (!postsRead[post._id]) {

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
    const postsReadContext = useContext(PostsReadContext);
    const currentUser = useCurrentUser();
    
    const {postsRead, setPostRead} = postsReadContext as PostsReadContextType;
    const {post, increasePostViewCount, recordEvent} = props;
    const isRead = post && ((post._id in postsRead) ? postsRead[post._id] : post.isRead)
    
    return <Component
      {...props}
      recordPostView={recordPostView({post, postsRead, setPostRead, increasePostViewCount, currentUser, recordEvent})}
      isRead={isRead}
    />
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
