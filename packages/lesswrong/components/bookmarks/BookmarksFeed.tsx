import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { FeedPostMetaInfo, FeedCommentMetaInfo, DisplayFeedCommentThread, FeedItemDisplayStatus } from '../ultraFeed/ultraFeedTypes';
import { DEFAULT_SETTINGS, UltraFeedSettingsType } from '../ultraFeed/ultraFeedSettingsTypes';
import { UltraFeedObserverProvider } from '../ultraFeed/UltraFeedObserver';
import { OverflowNavObserverProvider } from '../ultraFeed/OverflowNavObserverContext';
import { useMulti } from '../../lib/crud/withMulti';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import FeedItemWrapper from "../ultraFeed/FeedItemWrapper";
import UltraFeedPostItem from "../ultraFeed/UltraFeedPostItem";
import UltraFeedThreadItem from "../ultraFeed/UltraFeedThreadItem";

const BookmarksFeed = () => {
  const currentUser = useCurrentUser();

  const { results: bookmarks = [], loading, error } = useMulti({
    collectionName: "Bookmarks",
    fragmentName: "BookmarksFeedItemFragment",
    terms: {
      view: "myBookmarks",
      userId: currentUser?._id,
      limit: 20,
    },
    skip: !currentUser,
  });
  
  if (!currentUser || (loading && !bookmarks.length)) {
    return <SingleColumnSection>
      <Loading />
    </SingleColumnSection>;
  }

  if (error) {
    return <SingleColumnSection><p>Error loading bookmarks: {error.message}</p></SingleColumnSection>;
  }

  const settings: UltraFeedSettingsType = {
    ...DEFAULT_SETTINGS,
    postTruncationBreakpoints: [50, 2000],
    commentTruncationBreakpoints: [50, 500, 1000],
    postTitlesAreModals: true,
    incognitoMode: true, 
  };

  return (
    <AnalyticsContext pageSectionContext="bookmarksFeed">
      <UltraFeedObserverProvider incognitoMode={true} >
      <OverflowNavObserverProvider>
      <SingleColumnSection>
        <SectionTitle title="All Bookmarks" />
        {bookmarks.map((bookmark: any, index) => {
          const typedBookmark = bookmark;

          if (typedBookmark.collectionName === 'Posts' && typedBookmark.post) {
            const postMetaInfo: FeedPostMetaInfo = {
              sources: ["bookmarks"],
              displayStatus: "expanded" as FeedItemDisplayStatus
            };
            return (
              <FeedItemWrapper key={typedBookmark._id || `post-${index}`}>
                <UltraFeedPostItem
                  post={typedBookmark.post}
                  postMetaInfo={postMetaInfo}
                  index={index}
                  settings={settings}
                />
              </FeedItemWrapper>
            );
          } else if (typedBookmark.collectionName === 'Comments' && typedBookmark.comment) {
            const commentData = typedBookmark.comment;
            const commentMetaInfos: Record<string, FeedCommentMetaInfo> = {
              [commentData._id]: {
                sources: ['bookmarks'] as const,
                displayStatus: 'expanded' as FeedItemDisplayStatus,
                lastServed: typedBookmark.lastUpdated, 
                lastViewed: null, 
                lastInteracted: null,
                postedAt: commentData.postedAt,
                directDescendentCount: commentData.directChildrenCount
              }
            };
            const threadData: DisplayFeedCommentThread = {
              _id: `bookmark-comment-${commentData._id}`,
              comments: [commentData], 
              commentMetaInfos,
            };
            return (
              <FeedItemWrapper key={typedBookmark._id || `comment-${index}`}>
                <UltraFeedThreadItem
                  thread={threadData}
                  index={index}
                  settings={settings}
                />
              </FeedItemWrapper>
            );
          }
          return null;
        })}
        {bookmarks.length === 0 && !loading && (
          <p>No bookmarks yet.</p>
        )}
      </SingleColumnSection>
      </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </AnalyticsContext>
  );
};

export default BookmarksFeed;

 
