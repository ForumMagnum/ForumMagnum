import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { gql, useQuery } from '@apollo/client';
import { useNamesAttachedReactionsVoting } from '../votes/lwReactions/NamesAttachedReactionsVoteOnComment';
import { NamesAttachedReactionsVote } from '../../lib/voting/namesAttachedReactions';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl, PostsMinimumForGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';


type GetPostsByUserReactsProps = {
  classes: ClassesType,
  targetUserId: string,
  reactType?: string,
  limit?: number,
}

const GetPostsByUserReacts: React.FC<GetPostsByUserReactsProps> = ({ classes, targetUserId, reactType, limit = 20}: { classes: ClassesType, targetUserId: string, reactType?: string, limit?: number }) => {

  const { Loading, PostsTooltip } = Components;
    
  const { loading, error, data } = useQuery(gql`
    query AllReactsForUser($userId: String!, $reactType: String, $limit: Int) {
      AllReactsForUser(userId: $userId, reactType: $reactType, limit: $limit) {
        _id,
        userId,
        documentId,
        extendedVoteType,
        collectionName,
      }
    }
  `, {
    variables: { userId: targetUserId, reactType: reactType, limit : limit },
  });

  const allReacts:DbVote[] = data?.AllReactsForUser

  if (loading) return < Loading />
  if (error) return <p>Error: {error.message} </p>;

  const getReactType = (vote: DbVote) => {
    
    const namesAttachedReactionsVote:NamesAttachedReactionsVote = vote.extendedVoteType
    const userVote = namesAttachedReactionsVote.reacts?.[0]

    if (userVote) return userVote.react
    else return null
  }

  type GetPostOrCommentProps = {
    vote: DbVote,
    index: number,
  }
  // want to get the content, not which one it is
  const GetPostOrComment: React.FC<GetPostOrCommentProps> = ({vote, index}) => {

    const documentId = vote.documentId
    const isPost = vote.collectionName === "Posts"
    
    const {document : documentPost, error : errorPost, loading : loadingPost} = useSingle({
      documentId, 
      collectionName: "Posts",
      fragmentName: "PostsMinimumInfo",
      skip: (!isPost),
    })
    const {document : documentComment, error : errorComment, loading : loadingComment} = useSingle({
      documentId, 
      collectionName: "Comments",
      fragmentName: "CommentsListWithParentMetadata",
      skip: (isPost),
    })

    if (isPost) {

      if (loadingPost) return <Loading/>
      if (errorPost) return <p>Error: {errorPost.message} </p>;
      if (!documentPost) return <p>Error</p>;

      const postMinimumInfo:PostsMinimumInfo = documentPost

      return (
        <PostsTooltip key={index} postId={documentPost._id}>
          <Link key={index} to={postGetPageUrl({_id: postMinimumInfo._id, slug: postMinimumInfo.slug})}>{postMinimumInfo.title} </Link>
          <br/>
        </PostsTooltip>
      )
    }
    else {
      if (loadingComment) return <Loading/>
      if (errorComment) return <p>Error: {errorComment.message} </p>;
      if (!documentComment) return <p>Error</p>;

      const commentsListWithParentMetadata:CommentsListWithParentMetadata = documentComment

      return (
        <PostsTooltip key={index} postId={documentComment._id}>
          <Link key={index} to={commentGetPageUrlFromIds({commentId: commentsListWithParentMetadata._id})}>{commentsListWithParentMetadata.title} </Link>
          <br/>
        </PostsTooltip>
      )
    }
  }

  return (
    <div >
      {allReacts.length > 0 ? (
        allReacts.map((vote, index) => {
          <GetPostOrComment 
            vote={vote}
            index={index}>
          </GetPostOrComment>
          }
        )
      ) : (
        <p>(no reactions)</p>
      )}
    </div>
  );
}

type TopicSuggestionProps = {
  classes: ClassesType,
  user1: UsersCurrent,
  user2: UsersCurrent,
}

export const TopicSuggestions: React.FC<TopicSuggestionProps> = ({classes, user1, user2}: {
  classes: ClassesType,
  user1: UsersCurrent,
  user2: UsersCurrent,
}) => {
   
  return (
    <div>
      <p>Here are some comments and posts that have received recent reactions from {user1.displayName} and {user2.displayName}:</p>
      <GetPostsByUserReacts 
        classes={classes}
        targetUserId={user1._id}
        reactType={"agree"}
        limit={20}
      />
      <GetPostsByUserReacts
        classes={classes}
        targetUserId={user2._id}
        reactType={"agree"}
        limit={20}
      />
    </div>
  )
}


// async function suggestTopic(user1: UsersCurrent, user2: UsersCurrent) {


// // You can get the count of users who have agreed or disagreed as follows:
// const topic: DialogueTopic = suggestTopic(user1, user2)/* get a topic */
// const agreeCount = topic.agreeUserIds.length;
// const disagreeCount = topic.disagreeUserIds.length;

// const GetPostsByUserReactsComponent = registerComponent("GetPostsByUserReacts", GetPostsByUserReacts);

// declare global {
//   interface ComponentTypes {
//     GetPostsByUserReacts: typeof GetPostsByUserReactsComponent
//   }
// }

const TopicSuggestionsComponent = registerComponent("TopicSuggestions", TopicSuggestions);

declare global {
  interface ComponentTypes {
    TopicSuggestions: typeof TopicSuggestionsComponent
  }
}
