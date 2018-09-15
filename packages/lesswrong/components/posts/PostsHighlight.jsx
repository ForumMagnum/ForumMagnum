import { Components } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    maxWidth:570,
    ...postHighlightStyles(theme),
  },
  highlightContinue: {
    marginTop:theme.spacing.unit*2
  }
})

const PostsHighlight = ({post, classes}) => {
  return <div className={classes.root}>
      <Components.LinkPostMessage post={post} />
      <div dangerouslySetInnerHTML={{__html: post.htmlHighlight}}/>
      <div className={classes.highlightContinue}>
        {post.wordCount > 280 && <Link to={Posts.getPageUrl(post)}>
          (Continue Reading{` – ${post.wordCount - 280} more words`})
        </Link>}
      </div>
    </div>
};

PostsHighlight.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default defineComponent({
  name: 'PostsHighlight',
  component: PostsHighlight,
  styles: styles,
});
