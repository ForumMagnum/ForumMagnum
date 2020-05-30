import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  root: {
    maxWidth:570,
    ...postHighlightStyles(theme),
  },
  highlightContinue: {
    marginTop:theme.spacing.unit*2
  }
})

const PostsHighlight = ({post, classes}: {
  post: PostsList,
  classes: ClassesType,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {}
  return <div className={classes.root}>
      <Components.LinkPostMessage post={post} />
      <Components.ContentItemBody
        dangerouslySetInnerHTML={{__html: htmlHighlight}}
        description={`post ${post._id}`}
      />
      {wordCount > 280 && <div className={classes.highlightContinue}>
         <Link to={Posts.getPageUrl(post)}>
          (Continue Reading{` – ${wordCount - 280} more words`})
        </Link>
      </div>}
    </div>
};

const PostsHighlightComponent = registerComponent('PostsHighlight', PostsHighlight, {styles});

declare global {
  interface ComponentTypes {
    PostsHighlight: typeof PostsHighlightComponent
  }
}

