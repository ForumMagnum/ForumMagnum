import React, { useContext, useCallback, useState, useMemo } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { hookToHoc } from '../../lib/hocUtils';
import { recombeeApi } from '../../lib/recombee/client';
import { recombeeEnabledSetting, vertexEnabledSetting } from '../../lib/publicSettings';

export type ItemsReadContextType = {
  postsRead: Record<string,boolean>,
  setPostRead: (postId: string, isRead: boolean) => void,
  tagsRead: Record<string,boolean>,
  setTagRead: (tagId: string, isRead: boolean) => void,
};
const ItemsReadContext = React.createContext<ItemsReadContextType|null>(null);
export const useItemsRead = (): ItemsReadContextType => {
  const context = useContext(ItemsReadContext);
  if (!context) throw new Error("useItemsRead called but not a descedent of Layout");
  return context;
}
export const withItemsRead = hookToHoc(useItemsRead);

type ViewablePost = Pick<PostsBase, "_id" | "isRead" | "title" | "draft">;

interface RecombeeOptions {
  recommId?: string;
}

interface VertexOptions {
  attributionId?: string;
}

export interface RecommendationOptions {
  skip?: boolean;
  recombeeOptions?: RecombeeOptions;
  vertexOptions?: VertexOptions;
}

interface RecordPostViewArgs {
  post: ViewablePost;
  extraEventProperties?: Record<string,any>;
  recommendationOptions?: RecommendationOptions
}

export const useRecordPostView = (post: ViewablePost) => {
  const [increasePostViewCount] = useMutation(gql`
    mutation increasePostViewCountMutation($postId: String) {
      increasePostViewCount(postId: $postId)
    }
  `, {
    ignoreResults: true
  });

  const [sendVertexViewItemEvent] = useMutation(gql`
    mutation sendVertexViewItemEventMutation($postId: String!, $attributionId: String) {
      sendVertexViewItemEvent(postId: $postId, attributionId: $attributionId)
    }
  `, {
    ignoreResults: true
  });
  
  const {recordEvent} = useNewEvents()
  const currentUser = useCurrentUser();
  const {postsRead, setPostRead} = useItemsRead();
  const isRead = post && !!((post._id in postsRead) ? postsRead[post._id] : post.isRead)
  
  const recordPostView = useCallback(async ({post, extraEventProperties, recommendationOptions}: RecordPostViewArgs) => {
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
          ...extraEventProperties,
          documentId: post._id,
          postTitle: post.title,
        };
        
        recordEvent('post-view', true, eventProperties);
        if (recombeeEnabledSetting.get() && !recommendationOptions?.skip && !post.draft) {
          void recombeeApi.createDetailView(post._id, currentUser._id, recommendationOptions?.recombeeOptions?.recommId);
        }

        if (vertexEnabledSetting.get() && !recommendationOptions?.skip && !post.draft) {
          void sendVertexViewItemEvent({
            variables: {
              postId: post._id,
              attributionId: recommendationOptions?.vertexOptions?.attributionId
            }
          })
        }
      }
    } catch(error) {
      console.log("recordPostView error:", error); // eslint-disable-line
    }
  }, [postsRead, setPostRead, increasePostViewCount, sendVertexViewItemEvent, currentUser, recordEvent]);
  
  return { recordPostView, isRead };
}


export const useRecordTagView = (tag: TagFragment): {recordTagView: any, isRead: boolean} => {
  const {recordEvent} = useNewEvents()
  const currentUser = useCurrentUser();
  const {tagsRead, setTagRead} = useItemsRead();
  const isRead = tag && !!((tag._id in tagsRead) ? tagsRead[tag._id] : tag.isRead)
  
  const recordTagView = useCallback(async ({tag, extraEventProperties}: {
    tag: TagBasicInfo
    extraEventProperties: AnyBecauseHard
  }) => {
    try {
      if (!tag) throw new Error("Tried to record view of null tag");
      
      // Update the client-side read status cache
      if (!tagsRead[tag._id]) {
        setTagRead(tag._id, true);
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
          documentId: tag._id,
          tagName: tag.name,
        };
        
        recordEvent('tag-view', true, eventProperties);
      }
    } catch(error) {
      console.log("recordTagView error:", error); // eslint-disable-line
    }
  }, [tagsRead, setTagRead, currentUser, recordEvent]);
  
  return { recordTagView, isRead };
}

export const ItemsReadContextWrapper = ({children}: {children: React.ReactNode}) => {
  const [postsRead,setPostsRead] = useState<Record<string,boolean>>({});
  const [tagsRead,setTagsRead] = useState<Record<string,boolean>>({});
  const providedContext = useMemo(() => ({
    postsRead, tagsRead,
    
    setPostRead: (postId: string, isRead: boolean): void => {
      setPostsRead({...postsRead, [postId]: isRead});
    },
    setTagRead: (tagId: string, isRead: boolean): void => {
      setTagsRead({...tagsRead, [tagId]: isRead});
    },
  }), [postsRead, tagsRead]);
  
  return <ItemsReadContext.Provider value={providedContext}>
    {children}
  </ItemsReadContext.Provider>
}


