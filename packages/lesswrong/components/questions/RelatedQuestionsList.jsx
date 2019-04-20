import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
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

const RelatedQuestionsList = ({ post, currentUser, dimWhenLoading, classes }) => {

  const { RelatedQuestionsItem, SectionTitle } = Components

  const parentQuestionCount = post.sourcePostRelations && post.sourcePostRelations.length 
  const relatedQuestionCount = post.targetPostRelations && post.targetPostRelations.length 
  const totalRelatedQuestionCount = parentQuestionCount + relatedQuestionCount
  
  return (
    <div className={classNames(classes.root, {[classes.itemIsLoading]: dimWhenLoading})}>

      {(totalRelatedQuestionCount > 0) && <SectionTitle title={`${totalRelatedQuestionCount} Related Questions`} />}
      
      {post.sourcePostRelations.map((rel, i) => 
        <RelatedQuestionsItem
          key={rel._id}
          post={rel.sourcePost} 
          currentUser={currentUser} 
          index={i}
          parentQuestion
      /> )} 

      {post.targetPostRelations.map((rel, i) => 
        <RelatedQuestionsItem 
          key={rel._id} 
          post={rel.targetPost} 
          currentUser={currentUser} 
          index={i}
      /> )}
    </div>
  )
}

RelatedQuestionsList.propTypes = {
  results: PropTypes.array,
  terms: PropTypes.object,
  loading: PropTypes.bool,
  count: PropTypes.number,
  totalCount: PropTypes.number,
  loadMore: PropTypes.func,
  dimWhenLoading: PropTypes.bool,
  showLoading: PropTypes.bool,
  showLoadMore: PropTypes.bool,
  showNoResults:  PropTypes.bool,
};

registerComponent('RelatedQuestionsList', RelatedQuestionsList, withUser, withErrorBoundary, withStyles(styles, {name:"RelatedQuestionsList"}));
