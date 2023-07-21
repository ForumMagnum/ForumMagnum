import React, { useState, useCallback, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import AddBoxIcon from '@material-ui/icons/AddBox'
import { gql, useQuery } from '@apollo/client';
import { CommentTreeOptions } from '../comments/commentTree';
import { getAlgoliaIndexName } from '../../lib/search/algoliaUtil';
import { makeSortableListComponent } from '../form-components/sortableList';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from '../../lib/utils/unflatten';

const isEAForum = forumTypeSetting.get() === "EAForum"

const getTopUpvotedUsersQuery = gql`
  query TopUpvotedUsersQuery {
    TopUpvotedUsers {
      topUpvotedUsers {
        authorId
        displayName  
      }
    }
  }
`;

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
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
    justifyContent: "end"
  }
});

const RecentCommentsFeed = ({
  af, title="Recent Comments", shortformButton=true, classes
}: {
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
  classes: ClassesType
}) => {
  const { data } = useQuery(getTopUpvotedUsersQuery, { ssr: true });

  const topUpvotedUserIds: string[] = data?.TopUpvotedUsers?.topUpvotedUsers?.map(({ authorId }: AnyBecauseTodo) => authorId) ?? [];

  const [userIds, setUserIds] = useState(topUpvotedUserIds);
  
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
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
    PopularComment,
    SearchAutoComplete,
    CommentsNode
  } = Components;
  
  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const showShortformButton = !isEAForum && currentUser?.isReviewed && shortformButton && !currentUser.allCommentingDisabled

  const getCommentTreeOptions: (comment: CommentsListWithParentMetadata) => CommentTreeOptions = (comment: CommentsListWithParentMetadata) => ({
    scrollOnExpand: true,
    // lastCommentId: lastCommentId,
    // highlightDate: lastVisitedAt,
    refetch: refetch,
    condensed: true,
    post: comment.post ?? undefined,
    showPostTitle: true,
    forceNotSingleLine: true,
    loadChildrenOnClick: true,
    showCollapseButtons: true
  });
  
  return (
    <AnalyticsContext pageSectionContext="recentComments">
      <AnalyticsInViewTracker eventProps={{inViewType: "recentComments"}}>
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
            resolverName="RecentCommentsFeed"
            sortKeyType="Date"
            resolverArgs={{ userIds: '[String]', af: 'Boolean' }}
            resolverArgsValues={{ userIds, af }}
            renderers={{
              recentComment: {
                fragmentName: "CommentsListWithParentMetadata",
                render: (comment: CommentsListWithParentMetadata) => {
                  // const topLevelCommentId = comment.topLevelCommentId ?? comment._id;

                  // const { results, loading } = useMulti({
                  //   collectionName: 'Comments',
                  //   fragmentName: 'CommentsListWithParentMetadata',
                  //   terms: {
                  //     view: 'repliesToCommentThread',
                  //     topLevelCommentId
                  //   },
                  //   limit: 1000,
                  //   ssr: false
                  // });

                  // const parentCommentIds: string[] = [];
                  // let currentCommentParentId = comment.parentCommentId;
                  // let noParentFound = false;
                  // if (results?.length && currentCommentParentId && comment._id !== topLevelCommentId) {
                  //   while (parentCommentIds.at(-1) !== topLevelCommentId || !noParentFound) {
                  //     const currentParentCommentId = results.find(c => c._id === currentCommentParentId)?._id;
                  //     if (currentParentCommentId) {
                  //       parentCommentIds.push(currentParentCommentId);
                  //       currentCommentParentId = currentParentCommentId;
                  //     } else {
                  //       noParentFound = true;
                  //     }
                  //   }
                  // }

                  // const commentWithChildren = results && unflattenComments([comment, ...results.filter(c => !parentCommentIds.includes(c._id))])[0]

                  return <CommentsNode
                    treeOptions={getCommentTreeOptions(comment)}
                    startThreadTruncated={true}
                    expandAllThreads={expandAllThreads}
                    expandNewComments={false}
                    nestingLevel={1}
                    comment={comment}
                    // childComments={commentWithChildren?.children}
                    key={comment._id}
                    
                  />
                }
              }
            }}
          />
        </SingleColumnSection>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  )
}

const RecentCommentsFeedComponent = registerComponent('RecentCommentsFeed', RecentCommentsFeed, {
  areEqual: "auto", styles
});

declare global {
  interface ComponentTypes {
    RecentCommentsFeed: typeof RecentCommentsFeedComponent,
  }
}
