import { Components } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';
import PropTypes from 'prop-types';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    color: grey[600],
    marginBottom: theme.spacing.unit*2,
    fontSize:".9em",
    ...theme.typography.postStyle,
  },
})

const LinkPostMessage = ({post, classes}) => {
  return <div className={classes.root}>
          { post.url && <span>This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link></span>}
        </div>
}

LinkPostMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

export default defineComponent({
  name: 'LinkPostMessage',
  component: LinkPostMessage,
  styles: styles,
});
