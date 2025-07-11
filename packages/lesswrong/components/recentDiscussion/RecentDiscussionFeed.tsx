import React, { useState, useCallback, useRef, useMemo } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumSelect } from '../../lib/forumTypeUtils';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { isLWorAF } from '../../lib/instanceSettings';
import {showSubscribeReminderInFeed} from '../../lib/publicSettings'
import { ObservableQuery } from '@apollo/client';
import RecentDiscussionThread from "./RecentDiscussionThread";
import RecentDiscussionTag from "./RecentDiscussionTag";
import RecentDiscussionTagRevisionItem from "./RecentDiscussionTagRevisionItem";
import RecentDiscussionSubscribeReminder from "./RecentDiscussionSubscribeReminder";
import RecentDiscussionMeetupsPoke from "./RecentDiscussionMeetupsPoke";
import EARecentDiscussionThread from "./EARecentDiscussionThread";
import EARecentDiscussionQuickTake from "./EARecentDiscussionQuickTake";
import EARecentDiscussionTagCommented from "./EARecentDiscussionTagCommented";
import EARecentDiscussionTagRevision from "./EARecentDiscussionTagRevision";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { MixedTypeFeed } from "../common/MixedTypeFeed";
import AnalyticsInViewTracker from "../common/AnalyticsInViewTracker";
import { RecentDiscussionFeedQuery } from '../common/feeds/feedQueries';
import FeedSelectorDropdown from '../common/FeedSelectorCheckbox';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isBookUI } from '@/themes/forumTheme';
import { randomId } from '../../lib/random';

const styles = defineStyles("RecentDiscussionFeed", (theme: ThemeType) => ({
  titleRow: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
    width: '100%',
    ...(isBookUI && {
      color: theme.palette.text.bannerAdOverlay,
    }),
  },
  titleText: {
  },
  hiddenOnMobile: {
    display: 'block',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  feedSelectorMobileContainer: {
    marginBottom: 16,
    display: 'none',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
    },
  },
}));

const recentDisucssionFeedComponents = () => forumSelect({
  LWAF: {
    ThreadComponent: RecentDiscussionThread,
    ShortformComponent: RecentDiscussionThread,
    TagCommentedComponent: RecentDiscussionTag,
    TagRevisionComponent: RecentDiscussionTagRevisionItem,
    SubscribeReminderComponent: RecentDiscussionSubscribeReminder,
    MeetupsPokeComponent: RecentDiscussionMeetupsPoke,
  },
  default: {
    ThreadComponent: EARecentDiscussionThread,
    ShortformComponent: EARecentDiscussionQuickTake,
    TagCommentedComponent: EARecentDiscussionTagCommented,
    TagRevisionComponent: EARecentDiscussionTagRevision,
    SubscribeReminderComponent: RecentDiscussionSubscribeReminder,
    MeetupsPokeComponent: () => null,
  },
});

const RecentDiscussionFeed = ({
  commentsLimit, maxAgeHours, af,
  title="Recent Discussion", shortformButton=true
}: {
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
}) => {
  const classes = useStyles(styles);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const refetchRef = useRef<null|ObservableQuery['refetch']>(null);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads
  
  const sessionId = useMemo<string>(() => {
    if (typeof window === 'undefined') return randomId();
    const storage = window.sessionStorage;
    const currentId = storage ? storage.getItem('recentDiscussionSessionId') ?? randomId() : randomId();
    storage.setItem('recentDiscussionSessionId', currentId);
    return currentId;
  }, []);

  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode === F_Key) {
      setExpandAllThreads(true);
    }
  });

  const toggleShortformFeed = useCallback(
    () => {
      setShowShortformFeed(!showShortformFeed);
    },
    [setShowShortformFeed, showShortformFeed]
  );
  const refetch = useCallback(() => {
    if (refetchRef.current)
      void refetchRef.current();
  }, [refetchRef]);

  const {
    ThreadComponent,
    ShortformComponent,
    TagCommentedComponent,
    TagRevisionComponent,
    SubscribeReminderComponent,
    MeetupsPokeComponent,
  } = recentDisucssionFeedComponents();

  const subscribeReminderRenderer = showSubscribeReminderInFeed.get()
    ? { render: () => <SubscribeReminderComponent/> }
    : undefined;

  return (
    <AnalyticsContext pageSectionContext="recentDiscussion" recentDiscussionContext={{ sessionId }}>
      <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
        <SingleColumnSection>
          <SectionTitle title={title} titleClassName={classes.titleText}>
            <div className={classes.hiddenOnMobile}>
              <FeedSelectorDropdown currentFeedType="classic" />
            </div>
          </SectionTitle>
          <div className={classes.feedSelectorMobileContainer}>
            <FeedSelectorDropdown currentFeedType="classic" />
          </div>
          <MixedTypeFeed
            query={RecentDiscussionFeedQuery}
            variables={{
              commentsLimit,
              maxAgeHours,
              tagCommentsLimit: commentsLimit,
              af,
            }}
            firstPageSize={10}
            pageSize={20}
            refetchRef={refetchRef}
            renderers={{
              postCommented: {
                render: (post: PostsRecentDiscussion, index: number) => (
                  <AnalyticsContext pageSubSectionContext='recentDiscussionThread' recentDiscussionCardIndex={index}>
                  <ThreadComponent
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments ?? undefined}
                    expandAllThreads={expandAll}
                  />
                  </AnalyticsContext>
                )
              },
              shortformCommented: {
                render: (post: ShortformRecentDiscussion, index: number) => (
                  <AnalyticsContext pageSubSectionContext='recentDiscussionShortform' recentDiscussionCardIndex={index}>
                  <ShortformComponent
                    post={post}
                    refetch={refetch}
                    comments={post.recentComments ?? undefined}
                    expandAllThreads={expandAll}
                  />
                  </AnalyticsContext>
                )
              },
              tagDiscussed: {
                render: (tag: TagRecentDiscussion, index: number) => (
                  <AnalyticsContext pageSubSectionContext='recentDiscussionTag' recentDiscussionCardIndex={index}>
                  <TagCommentedComponent
                    tag={tag}
                    refetch={refetch}
                    comments={tag.recentComments}
                    expandAllThreads={expandAll}
                  />
                  </AnalyticsContext>
                )
              },
              tagRevised: {
                render: (revision: RecentDiscussionRevisionTagFragment, index: number) => <div>
                  {revision.tag && revision.documentId && (
                    <AnalyticsContext recentDiscussionCardIndex={index}>
                      <TagRevisionComponent
                        tag={revision.tag}
                        revision={revision}
                        headingStyle="full"
                        documentId={revision.documentId}
                      />
                    </AnalyticsContext>
                  )}
                </div>,
              },

              subscribeReminder: subscribeReminderRenderer,
              meetupsPoke: {
                render: () => <MeetupsPokeComponent />
              },
            }}
          />
        </SingleColumnSection>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  )
}

export default registerComponent('RecentDiscussionFeed', RecentDiscussionFeed, {
  areEqual: "auto",
});


