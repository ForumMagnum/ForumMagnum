import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withErrorBoundary from '../common/withErrorBoundary';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
    marginBottom: 100,
    [theme.breakpoints.down('md')]: {
      width: "unset",
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  itemIsLoading: {
    opacity: .4,
  },
  loading: {
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  header: {
    ...theme.typography.body2,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit/2,
    color: theme.palette.grey[700]
  }
})

const RelatedQuestionsList = ({ post, currentUser, classes }) => {

  const { PostsItem2, SectionTitle } = Components

  
  const sourcePostRelations = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)
  const targetPostRelations = _.filter(post.targetPostRelations, rel => !!rel.targetPost)

  const totalRelatedQuestionCount = sourcePostRelations.length + targetPostRelations.length
  
  const showParentLabel = sourcePostRelations.length > 0
  const showSubQuestionLabel = (sourcePostRelations.length > 0) && (targetPostRelations.length > 0)

  return (
    <div className={classes.root}>

      {(totalRelatedQuestionCount > 0) && <SectionTitle title={`${totalRelatedQuestionCount} Related Questions`} />}
      
      {showParentLabel && <div className={classes.header}>Parent Question{(sourcePostRelations.length > 1) && "s"}</div>}
      {sourcePostRelations.map((rel, i) => 
        <PostsItem2
          key={rel._id}
          post={rel.sourcePost} 
          currentUser={currentUser} 
          index={i}
          parentQuestion
      /> )} 
      {showSubQuestionLabel && <div className={classes.header}>Sub-Questions</div>}
      {targetPostRelations.map((rel, i) => 
        <PostsItem2 
          key={rel._id} 
          post={rel.targetPost} 
          currentUser={currentUser} 
          index={i}
      /> )}
    </div>
  )
}

RelatedQuestionsList.propTypes = {
  post: PropTypes.object,
};

registerComponent('RelatedQuestionsList', RelatedQuestionsList, withUser, withErrorBoundary, withStyles(styles, {name:"RelatedQuestionsList"}));
