// import classNames from 'classnames';
// import React, { useCallback, useState } from 'react';
// import { useLocation } from '../../../lib/routeUtil';
// import { Components, registerComponent } from '../../../lib/vulcan-lib';
// import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
// import { EditTagForm } from '../EditTagPage';
// import { useApolloClient } from '@apollo/client/react';
// import truncateTagDescription from "../../../lib/utils/truncateTagDescription";
// import { forumTypeSetting, taggingNamePluralSetting } from '../../../lib/instanceSettings';
// import { truncate } from '../../../lib/editor/ellipsize';
// import { tagPostTerms } from '../TagPage';
// import { useOnSearchHotkey } from '../../common/withGlobalKeydown';
// import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
// import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../../lib/collections/tags/helpers';
// import { useCurrentUser } from '../../common/withUser';

// const styles = (theme: ThemeType): JssStyles => ({
  
// })

// const isEAForum = forumTypeSetting.get() === 'EAForum'

// const SubforumSubforumTab = ({tag, revision, truncated, setTruncated, classes}: {
//   tag: TagPageFragment | TagPageWithRevisionFragment,
//   revision?: string,
//   truncated: boolean,
//   setTruncated: (truncated: boolean) => void,
//   classes: ClassesType,
// }) => {

//   const {
//     PostsListSortDropdown,
//     PostsList2,
//     ContentItemBody,
//     AddPostsToTag,
//     UsersNameDisplay,
//     TagDiscussionSection,
//     TagPageButtonRow,
//     TagIntroSequence,
//     SectionTitle,
//     ContentStyles,
//     TagFlagItem
//   } = Components;

//   return (
//     <div className={classNames(classes.centralColumn, classes.feedWrapper)}>
//       {query.commentId && (
//         <div className={classes.commentPermalink}>
//           <CommentPermalink documentId={query.commentId} />
//         </div>
//       )}
//       <div className={classes.feedHeader}>
//         <div className={classes.feedHeaderButtons}>
//           {discussionButton}
//           {newPostButton}
//         </div>
//         <PostsListSortDropdown value={sortBy} options={subforumSortings} />
//       </div>
//       {newDiscussionOpen && (
//         <div className={classes.newDiscussionContainer}>
//           {/* FIXME: bug here where the submit and cancel buttons don't do anything the first time you click on them, on desktop only */}
//           <CommentsNewForm
//             tag={tag}
//             tagCommentType={"SUBFORUM"}
//             successCallback={refetch}
//             type="reply" // required to make the Cancel button appear
//             enableGuidelines={true}
//             cancelCallback={() => setNewDiscussionOpen(false)}
//           />
//         </div>
//       )}
//       <MixedTypeFeed
//         firstPageSize={15}
//         pageSize={20}
//         refetchRef={refetchRef}
//         resolverName={`Subforum${subforumSortingToResolverName(sortBy)}Feed`}
//         sortKeyType={subforumSortingTypes[sortBy]}
//         resolverArgs={{
//           tagId: "String!",
//           af: "Boolean",
//         }}
//         resolverArgsValues={{
//           tagId: tag._id,
//           af: false,
//         }}
//         fragmentArgs={{
//           maxAgeHours: "Int",
//           commentsLimit: "Int",
//         }}
//         fragmentArgsValues={{
//           maxAgeHours,
//           commentsLimit,
//         }}
//         renderers={{
//           tagSubforumPosts: {
//             fragmentName: "PostsRecentDiscussion",
//             render: (post: PostsRecentDiscussion) => (
//               <div className={classes.feedPostWrapper}>
//                 <RecentDiscussionThread
//                   key={post._id}
//                   post={{ ...post }}
//                   comments={post.recentComments}
//                   maxLengthWords={50}
//                   refetch={refetch}
//                   smallerFonts
//                 />
//               </div>
//             ),
//           },
//           tagSubforumComments: {
//             fragmentName: "CommentWithRepliesFragment",
//             render: (comment: CommentWithRepliesFragment) => (
//               <CommentWithReplies
//                 key={comment._id}
//                 comment={comment}
//                 commentNodeProps={commentNodeProps}
//                 initialMaxChildren={5}
//               />
//             ),
//           },
//           tagSubforumStickyComments: {
//             fragmentName: "StickySubforumCommentFragment",
//             render: (comment: CommentWithRepliesFragment) => (
//               <CommentWithReplies
//                 key={comment._id}
//                 comment={{ ...comment, isPinnedOnProfile: true }}
//                 commentNodeProps={{
//                   ...commentNodeProps,
//                   showPinnedOnProfile: true,
//                   treeOptions: {
//                     ...commentNodeProps.treeOptions,
//                     showPostTitle: true,
//                   },
//                 }}
//                 initialMaxChildren={3}
//                 startExpanded={false}
//               />
//             ),
//           },
//         }}
//       />
//     </div>
//   );
// }

// const SubforumSubforumTabComponent = registerComponent(
//   'SubforumSubforumTab', SubforumSubforumTab, {styles}
// );

// declare global {
//   interface ComponentTypes {
//     SubforumSubforumTab: typeof SubforumSubforumTabComponent
//   }
// }
