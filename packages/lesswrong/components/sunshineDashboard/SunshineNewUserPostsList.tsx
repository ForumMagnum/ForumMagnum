import React, {useMemo} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper'
import _filter from 'lodash/filter';
import type { VoteWidgetOptions } from '../../lib/voting/votingSystems';

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
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

const SunshineNewUserPost = ({post, classes}: {
  post: SunshinePostsList,
  classes: ClassesType
}) => {
  const { MetaInfo, FormatDate, PostsTitle, SmallSideVote, PostsPageActions, ContentStyles } = Components
  const voteWidgetOptions: VoteWidgetOptions = useMemo(() => ({
    hideKarma: false
  }), []);
 
  return <div className={classes.post}>
    <div className={classes.row}>
      <div>
        <Link to={`/posts/${post._id}`}>
          <PostsTitle post={post} showIcons={false} wrap/>
          {(post.status !==2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
        </Link>
        <span className={classes.meta}>
          <MetaInfo><FormatDate date={post.postedAt}/> </MetaInfo>
          <SmallSideVote document={post} collection={Posts} options={voteWidgetOptions}/>
        </span>
      </div>
      <PostsPageActions post={post} />
    </div>
    {!post.draft && <ContentStyles contentType="postHighlight" className={classes.postBody}>
      <div dangerouslySetInnerHTML={{__html: (post.contents?.htmlHighlight || "")}} />
    </ContentStyles>}
  </div>
}

const SunshineNewUserPostsList = ({posts, user, classes}: {
  posts?: SunshinePostsList[],
  classes: ClassesType,
  user: SunshineUsersList
}) => {
  if (!posts) return null

  const newPosts = user.reviewedAt ? _filter(posts, post => post.postedAt > user.reviewedAt) : posts

  return <div>
    {newPosts.map(post => <SunshineNewUserPost
      key={post._id}
      post={post}
      classes={classes}/>
    )}
  </div>
}

const SunshineNewUserPostsListComponent = registerComponent('SunshineNewUserPostsList', SunshineNewUserPostsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUserPostsList: typeof SunshineNewUserPostsListComponent
  }
}
