import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withErrorBoundary from '../common/withErrorBoundary';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
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
})

const RelatedQuestionsList = ({ post, currentUser, classes }) => {

  const { PostsItem2, SectionTitle } = Components

  const parentQuestionCount = post.sourcePostRelations && post.sourcePostRelations.length 
  const relatedQuestionCount = post.targetPostRelations && post.targetPostRelations.length 
  const totalRelatedQuestionCount = parentQuestionCount + relatedQuestionCount
  
  return (
    <div className={classes.root}>

      {(totalRelatedQuestionCount > 0) && <SectionTitle title={`${totalRelatedQuestionCount} Related Questions`} />}
      
      {post.sourcePostRelations && post.sourcePostRelations.map((rel, i) => 
        <PostsItem2
          key={rel._id}
          post={rel.sourcePost} 
          currentUser={currentUser} 
          index={i}
          parentQuestion
      /> )} 

      {post.targetPostRelations && post.targetPostRelations.map((rel, i) => 
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
