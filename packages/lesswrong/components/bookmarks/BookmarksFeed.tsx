import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { FeedPostMetaInfo } from '../ultraFeed/ultraFeedTypes';
import { DEFAULT_SETTINGS, UltraFeedSettingsType } from '../ultraFeed/ultraFeedSettingsTypes';
import { UltraFeedObserverProvider } from '../ultraFeed/UltraFeedObserver';
import { OverflowNavObserverProvider } from '../ultraFeed/OverflowNavObserverContext';

const BookmarksFeed = () => {
  const { MixedTypeFeed, SingleColumnSection, SectionTitle, Loading, FeedItemWrapper, UltraFeedPostItem, UltraFeedThreadItem } = Components;
  const currentUser = useCurrentUser();
  
  if (!currentUser) {
    return <SingleColumnSection>
      <Loading />
    </SingleColumnSection>;
  }

  // we don't need most of these but the UltraFeed components expect all of them
  const settings: UltraFeedSettingsType = {
    ...DEFAULT_SETTINGS,
    postTruncationBreakpoints: [50, 2000],
    commentTruncationBreakpoints: [50, 500, 1000],
    postTitlesAreModals: true,
    incognitoMode: true, 
  }

  return (
    <AnalyticsContext pageSectionContext="bookmarksFeed">
      <UltraFeedObserverProvider incognitoMode={true} >
      <OverflowNavObserverProvider>
      <SingleColumnSection>
        <SectionTitle title="Your Bookmarks" />
        <MixedTypeFeed
          resolverName="BookmarksFeed"
          sortKeyType="Date"
          firstPageSize={20}
          pageSize={20}
          loadMoreDistanceProp={500}
          renderers={{
            feedPost: {
              fragmentName: 'FeedPostFragment',
              render: (item: FeedPostFragment, index: number) => {
                if (!item) return null;
                
                const { post } = item;

                const postMetaInfo: FeedPostMetaInfo = {
                  sources: ["bookmarks"],
                  displayStatus: "expanded"
                }

                return (
                  <FeedItemWrapper>
                    <UltraFeedPostItem
                      post={post}
                      postMetaInfo={postMetaInfo}
                      index={index}
                      settings={settings}
                    />
                  </FeedItemWrapper>
                )
              }
            },
            feedCommentThread: {
              fragmentName: 'FeedCommentThreadFragment',
              render: (item: FeedCommentThreadFragment, index: number) => {
                if (!item) return null;

                return (
                  <FeedItemWrapper>
                    <UltraFeedThreadItem
                      thread={item}
                      index={index}
                      settings={settings}
                    />
                  </FeedItemWrapper>
                )
              }
            }
          }}
        />
      </SingleColumnSection>
      </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </AnalyticsContext>
  );
};

const BookmarksFeedComponent = registerComponent('BookmarksFeed', BookmarksFeed);

export default BookmarksFeed;

declare global {
  interface ComponentTypes {
    BookmarksFeed: typeof BookmarksFeedComponent
  }
} 
