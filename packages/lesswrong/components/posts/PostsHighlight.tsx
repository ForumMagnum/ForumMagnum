import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import React from 'react';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';
import { truncate } from '../../lib/editor/ellipsize';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth:570,
    ...postHighlightStyles(theme),
  },
  highlightContinue: {
    marginTop:theme.spacing.unit*2
  }
})

const PostsHighlight = ({post, maxLengthWords, classes}: {
  post: PostsList,
  maxLengthWords?: number,
  classes: ClassesType,
}) => {
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {}
  
  const truncatedHighlight = maxLengthWords ? truncate(htmlHighlight, maxLengthWords, "words") : htmlHighlight;
  
  return <div className={classes.root}>
      <Components.LinkPostMessage post={post} />
      <Components.ContentItemBody
        dangerouslySetInnerHTML={{__html: truncatedHighlight}}
        description={`post ${post._id}`}
      />
      {wordCount > 280 && <div className={classes.highlightContinue}>
         <Link to={postGetPageUrl(post)}>
          (Continue Reading
          {maxLengthWords && ` – ${wordCount - maxLengthWords} more words`})
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

