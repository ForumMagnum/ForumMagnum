import React, { useContext, useCallback } from 'react';
import { useMutation } from 'react-apollo';
import { useCurrentUser } from './withUser';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { hookToHoc } from '../../lib/hocUtils';
import gql from 'graphql-tag';

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

export const useRecordPostView = (post: PostsBase): {recordPostView: any, isRead: boolean} => {
  const [increasePostViewCount] = useMutation(gql`
    mutation increasePostViewCountMutation($postId: String) {
      increasePostViewCount(postId: $postId)
    }
  `, {
    ignoreResults: true
  });
  
  const {recordEvent} = useNewEvents()
  const currentUser = useCurrentUser();
  const {postsRead, setPostRead} = usePostsRead();
  const isRead = post && ((post._id in postsRead) ? postsRead[post._id] : post.isRead)
  
  const recordPostView = useCallback(async ({post, extraEventProperties}) => {
    try {
      if (!post) throw new Error("Tried to record view of null post");
      
      // a post id has been found & it's has not been seen yet on this client session
      if (!postsRead[post._id]) {

        // Trigger the asynchronous mutation with postId as an argument
        // Deliberately not awaiting, because this should be fire-and-forget
        await increasePostViewCount({
          variables: {
            postId: post._id
          }
        });

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
  }, [postsRead, setPostRead, increasePostViewCount, currentUser, recordEvent]);
  
  return { recordPostView, isRead };
}

export const withRecordPostView = hookToHoc(useRecordPostView);

export default withRecordPostView;
