import { Components, registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { postHighlightStyles } from '../../themes/stylePiping'
import { Link } from 'react-router';
import PropTypes from 'prop-types';

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
  const { htmlHighlight = "", wordCount = 0 } = post.contents || {}
  return <div className={classes.root}>
      <Components.LinkPostMessage post={post} />
      <div dangerouslySetInnerHTML={{__html: htmlHighlight}}/>
      <div className={classes.highlightContinue}>
        {wordCount > 280 && <Link to={Posts.getPageUrl(post)}>
          (Continue Reading{` – ${wordCount - 280} more words`})
        </Link>}
      </div>
    </div>
};

PostsHighlight.displayName = "PostsHighlight";

PostsHighlight.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('PostsHighlight', PostsHighlight, withStyles(styles, {name:"PostsHighlight"}));
