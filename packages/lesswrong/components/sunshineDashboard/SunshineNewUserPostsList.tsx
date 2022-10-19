import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper'
import _filter from 'lodash/filter';

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
  }
})

const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  const { MetaInfo, FormatDate, PostsTitle, SmallSideVote, PostsPageActions, ContentStyles } = Components
 
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
            <span className={classes.meta}>
              <MetaInfo><FormatDate date={post.postedAt}/> </MetaInfo>
              <SmallSideVote document={post} collection={Posts}/>
            </span>
          </div>
          <PostsPageActions post={post} />
        </div>
        {!post.draft && <ContentStyles contentType="postHighlight" className={classes.postBody}>
          <div dangerouslySetInnerHTML={{__html: (post.contents?.html || "")}} />
        </ContentStyles>}
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
