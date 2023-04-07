import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper'
import _filter from 'lodash/filter';
import { postGetCommentCount, postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import RejectedIcon from "@material-ui/icons/NotInterested";
import { useUpdate } from '../../lib/crud/withUpdate';
import { isLW } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  meta: {
    display: 'inline-block'
  },
  vote: {
    marginRight: 10
  },
  rejectedIcon: {
    position: "absolute",
    right: 40,
    color: theme.palette.grey[500],
    cursor: "pointer",
  },
  rejectedLabel: {
    position: "absolute",
    right: 40,
    color: theme.palette.grey[500],
    cursor: "pointer",
  }
})

const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { MetaInfo, FormatDate, PostsTitle, SmallSideVote, PostActionsButton, ContentStyles, LinkPostMessage } = Components

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
  });

  const setPostRejectedStatus = (post: SunshinePostsList, rejected: boolean) => () => {
    void updatePost({
      selector: { _id: post._id },
      data: { rejected }
    });
  };
 
  if (!posts) return null

  const newPosts = user.reviewedAt ? _filter(posts, post => post.postedAt > user.reviewedAt) : posts

  return (
    <div>
      {newPosts.map(post=><div className={classes.post} key={post._id}>
        <div className={classes.row}>
          <div>
            <Link to={`/posts/${post._id}`}>
              <PostsTitle post={post} showIcons={false} wrap/> 
              {(post.status !==2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
            </Link>
            <div>
              <span className={classes.meta}>
                <span className={classes.vote}>
                  <SmallSideVote document={post} collection={Posts}/>
                </span>
                <MetaInfo>
                  <FormatDate date={post.postedAt}/>
                </MetaInfo>
                <MetaInfo>
                  <Link to={`${postGetPageUrl(post)}#comments`}>
                    {postGetCommentCountStr(post)}
                  </Link>
                </MetaInfo>
              </span>
            </div>
          </div>
          
          {isLW && <>
            {post.rejected && <span className={classes.rejectedLabel} onClick={setPostRejectedStatus(post, false)}>
              [Rejected]
            </span>}
            {!post.rejected && post.authorIsUnreviewed && <span className={classes.rejectedIcon}>
              <RejectedIcon onClick={setPostRejectedStatus(post, true)} />
            </span>}
          </>}
          
          <PostActionsButton post={post} />
        </div>
        {!post.draft && <div className={classes.postBody}>
          <LinkPostMessage post={post}/>
          <ContentStyles contentType="postHighlight">
            <div dangerouslySetInnerHTML={{__html: (post.contents?.html || "")}} />
          </ContentStyles>
        </div>}
      </div>)}
    </div>
  )
}

const SunshineNewUserPostsListComponent = registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserPostsList: typeof SunshineNewUserPostsListComponent
  }
}
