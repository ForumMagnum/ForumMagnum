import React from 'react';
import { withList, Components, registerComponent} from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/utils/unflatten';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    fontSize: "1rem",
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginTop: 20,
    marginBottom: 12
  }
})

const PostReviewsAndNominations = ({ classes, title, loading, results, post, singleLine }) => {

  const { Loading, CommentsList, SubSection } = Components

  if (!loading && results && !results.length) {
    return null
  } 
  
  const lastCommentId = results && results[0]?._id
  const nestedComments = unflattenComments(results);
  return (
    <div>
      {title && <div className={classes.title}>
        {loading && <Loading/>}
        {results && results.length}{" "}
        {title}
        {(results && results.length > 1) && "s"}
      </div>}
      <SubSection>
        <CommentsList
          comments={nestedComments}
          startThreadTruncated={true}
          post={post}
          lastCommentId={lastCommentId}
          forceSingleLine={singleLine}
          forceNotSingleLine={!singleLine}
          hideSingleLineMeta={singleLine}
          enableHoverPreview={false}
        />
      </SubSection>
    </div>
  );
};

const options = {
  collection: Comments,
  queryName: 'PostsItemNewCommentsThreadQuery',
  fragmentName: 'CommentsList',
  fetchPolicy: 'cache-and-network',
  limit: 5,
  // enableTotal: false,
};

registerComponent('PostReviewsAndNominations', PostReviewsAndNominations, [withList, options], withStyles(styles, {name:"PostReviewsAndNominations"}));
