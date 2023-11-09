import React, { useRef } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { gql, useQuery } from '@apollo/client';
import { useNamesAttachedReactionsVoting } from '../votes/lwReactions/NamesAttachedReactionsVoteOnComment';
import { NamesAttachedReactionType } from '../../lib/voting/reactions';
import { NamesAttachedReactionsVote } from '../../lib/voting/namesAttachedReactions';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from 'react-router-dom';
import { postGetPageUrl, PostsMinimumForGetPageUrl } from '../../lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';

// Should this be its own component?
// I vote yes

const UserReacts = ({ classes, targetUserId, reactType, limit = 20}: { classes: ClassesType, targetUserId: string, reactType?: string, limit?: number }) => {
  // const currentUser = useCurrentUser();
  const { Loading, PostsTooltip, LWDialog, PostLinkCommentPreview } = Components;
    
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

  // want to get the content, not which one it is
  const getPostOrComment = (vote: DbVote, index: number) => {

    const documentId = vote.documentId
    const isPost = vote.collectionName === "Posts"

    if (isPost) {
      const {document, error, loading} = useSingle({
        documentId, 
        collectionName: "Posts",
        fragmentName: "PostsMinimumInfo",
      })
      if (loading) return <Loading/>
      if (error) return <p>Error: {error.message} </p>;
      if (!document) return null;

      const postMinimumInfo:PostsMinimumInfo = document

      return (
        <PostsTooltip key={index} postId={document._id}>
          <Link key={index} to={postGetPageUrl({_id: postMinimumInfo._id, slug: postMinimumInfo.slug})}>{postMinimumInfo.title} </Link>
          <br/>
        </PostsTooltip>
      )
    }
    else {
      const {document, error, loading} = useSingle({
        documentId, 
        collectionName: "Comments",
        fragmentName: "CommentsListWithParentMetadata",
      })
      if (loading) return <Loading/>
      if (error) return <p>Error: {error.message} </p>;
      if (!document) return null;

      const commentsListWithParentMetadata:CommentsListWithParentMetadata = document

      return (
        <PostsTooltip key={index} postId={document._id}>
          <Link key={index} to={commentGetPageUrlFromIds({commentId: commentsListWithParentMetadata._id})}>{commentsListWithParentMetadata.title} </Link>
          <br/>
        </PostsTooltip>
      )
    }
  }


  return (
    <div 
      // className={classNames(classes.gradientBigTextContainer, {
      //   'scrolled-to-top': isScrolledToTop,
      //   'scrolled-to-bottom': isScrolledToBottom
      // })} 
      // ref={readPostsContainerRef}
    >
      {allReacts.length > 0 ? (
        allReacts.map((vote, index) => {
          const post = vote.post;
          const comment = vote.comment;
            (
              // <PostsTooltip key={index} postId={post._id}>
              //   <Link key={index} to={postGetPageUrl(post)}>• {post.title} </Link>
              //   <br/>
              // </PostsTooltip>
            )
          }
        )
      ) : (
        <p>(no reactions)</p>
      )}
    </div>
  );
}

const GetPostsByUserReacts = ({userId, reactType = null}: {
    userId: string,
    reactType?: string | null
  }) => {
    const defaultLimit = 10;
    const pageSize = 30;
    
    const currentUser = useCurrentUser();
    const targerUser = useCurrentUser();


    // // how do I pass in the userId for the other user?
    // const {loadMoreProps, results} = usePaginatedResolver({
    //     fragmentName: "ReactsAll",
    //     resolverName: "Reacts",
    //     limit: 3,
    //     itemsPerPage: 5,
    //   });
  
    // if (loading) return <div>Loading...</div>
  
    return (<div>Retrieved votes</div>)
  };

const MyComponentComponent = registerComponent("MyComponent", MyComponent);

declare global {
  interface ComponentTypes {
    MyComponent: typeof MyComponentComponent
  }
}

type DialogueTopic = {
    topic: string;
    agreeUserIds: string[];
    disagreeUserIds: string[];
  };

async function suggestTopic(user1: UsersCurrent, user2: UsersCurrent): Promise<DialogueTopic> {
    
    
    // Logic to generate a topic based on the two users
    // This could involve analyzing their previous posts, comments, interests, etc.




    // For now, let's return a dummy topic
    return {
        topic: "Dummy topic",
        agreeUserIds: [],
        disagreeUserIds: []
    };
}

// // You can get the count of users who have agreed or disagreed as follows:
// const topic: DialogueTopic = suggestTopic(user1, user2)/* get a topic */
// const agreeCount = topic.agreeUserIds.length;
// const disagreeCount = topic.disagreeUserIds.length;
