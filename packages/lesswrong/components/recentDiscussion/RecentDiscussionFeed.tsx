import React, { useState, useCallback, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import AddBoxIcon from '@material-ui/icons/AddBox'
import { makeSortableListComponent } from '../form-components/sortableList';
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';

const isEAForum = forumTypeSetting.get() === "EAForum"

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const styles = (theme: ThemeType) => ({
  list: {
    display: "flex",
    flexWrap: "wrap",
    paddingTop: 4,
    justifyContent: "end"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily,
  },
  search: {
    display: "flex",
    justifyContent: "end",
    '& .react-autosuggest__suggestions-container--open': {
      position: "absolute",
      zIndex: 1,
      backgroundColor: theme.palette.background.default
    }
  }
});

const RecentDiscussionFeed = ({
  commentsLimit, maxAgeHours, af,
  title="Recent Discussion", shortformButton=true,
  classes
}: {
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
  classes: ClassesType
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const [userIds, setUserIds] = useState<string[]>([]);
  const refetchRef = useRef<null|(()=>void)>(null);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads
  
  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode == F_Key) {
      setExpandAllThreads(true);
    }
  });
  
  const toggleShortformFeed = useCallback(
    () => {
      setShowShortformFeed(!showShortformFeed);
    },
    [setShowShortformFeed, showShortformFeed]
  );
  
  const {
    SingleColumnSection,
    SectionTitle,
    SectionButton,
    ShortformSubmitForm,
    MixedTypeFeed,
    RecentDiscussionThread,
    RecentDiscussionTagRevisionItem,
    RecentDiscussionTag,
    RecentDiscussionSubscribeReminder,
    RecentDiscussionMeetupsPoke,
    AnalyticsInViewTracker,
    RecentDiscussionSubforumThread,
    SearchAutoComplete
  } = Components;
  
  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const showShortformButton = !isEAForum && currentUser?.isReviewed && shortformButton && !currentUser.allCommentingDisabled
  return (
    <AnalyticsContext pageSectionContext="recentDiscussion">
      <AnalyticsInViewTracker eventProps={{inViewType: "recentDiscussion"}}>
        <SingleColumnSection>
          <SectionTitle title={title} >
            {showShortformButton && <div onClick={toggleShortformFeed}>
              <SectionButton>
                <AddBoxIcon />
                New Shortform Post
              </SectionButton>
            </div>}
          </SectionTitle>
          {showShortformFeed && <ShortformSubmitForm successCallback={refetch}/>}
          <div className={classes.search}>
            <SearchAutoComplete
              indexName={getAlgoliaIndexName("Users")}
              clickAction={(userId) => setUserIds([...userIds, userId])}
              renderSuggestion={(hit: any) => <Components.UsersAutoCompleteHit document={hit} />}
              renderInputComponent={(hit: any) => <Components.UsersSearchInput inputProps={hit} />}
              placeholder={"Search for Users"}
              noSearchPlaceholder='User ID'
            />
          </div>
          <SortableList
            axis="xy"
            value={userIds}
            setValue={setUserIds}
            className={classes.list}
            classes={classes}
          />
          <MixedTypeFeed
            firstPageSize={10}
            pageSize={20}
            refetchRef={refetchRef}
            resolverName="RecentDiscussionFeed"
            sortKeyType="Date"
            resolverArgs={{ af: 'Boolean', userIds: '[String!]' }}
            resolverArgsValues={{ af, userIds }}
            fragmentArgs={{
              commentsLimit: 'Int',
              maxAgeHours: 'Int',
              tagCommentsLimit: 'Int',
              commentUserIds: '[String!]'
            }}
            fragmentArgsValues={{
              commentsLimit, maxAgeHours,
              tagCommentsLimit: commentsLimit,
              commentUserIds: userIds
            }}
            renderers={{
              postCommented: {
                fragmentName: "PostsRecentDiscussion",
                render: (post: PostsRecentDiscussion) => (
                  <RecentDiscussionThread
                    post={post}
                    refetch={refetch}
                    comments={post.recentCommentsPlus}
                    expandAllThreads={expandAll}
                  />
                )
              },
              recentComment: {
                fragmentName: "CommentsListWithDiscussionThread",
                render: (comment: CommentsListWithDiscussionThread) => (
                  comment.post && <RecentDiscussionThread
                    post={comment.post}
                    refetch={refetch}
                    comments={[comment, ...comment.post.recentCommentsPlus.filter(c => c._id !== comment._id)]}
                    expandAllThreads={expandAll}
                  />
                )
              },
              tagDiscussed: {
                fragmentName: "TagRecentDiscussion",
                render: (tag: TagRecentDiscussion) => (
                  <RecentDiscussionTag
                    tag={tag}
                    refetch={refetch}
                    comments={tag.recentComments}
                    expandAllThreads={expandAll}
                  />
                )
              },
              tagSubforumComments: {
                fragmentName: "CommentWithRepliesFragment",
                render: (comment: CommentWithRepliesFragment) => (
                  <RecentDiscussionSubforumThread
                    comment={comment}
                    tag={comment.tag}
                    refetch={refetch}
                    expandAllThreads={expandAll}
                  />
                ),
              },
              tagRevised: {
                fragmentName: "RevisionTagFragment",
                render: (revision: RevisionTagFragment) => <div>
                  {revision.tag && <RecentDiscussionTagRevisionItem
                    tag={revision.tag}
                    revision={revision}
                    headingStyle="full"
                    documentId={revision.documentId}
                  />}
                </div>,
              },
              subscribeReminder: {
                fragmentName: null,
                render: () => <RecentDiscussionSubscribeReminder/>
              },
              meetupsPoke: {
                fragmentName: null,
                render: () => isEAForum ? null : <RecentDiscussionMeetupsPoke/>
              },
            }}
          />
        </SingleColumnSection>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  )
}

const RecentDiscussionFeedComponent = registerComponent('RecentDiscussionFeed', RecentDiscussionFeed, {
  areEqual: "auto",
  styles
});

declare global {
  interface ComponentTypes {
    RecentDiscussionFeed: typeof RecentDiscussionFeedComponent,
  }
}
