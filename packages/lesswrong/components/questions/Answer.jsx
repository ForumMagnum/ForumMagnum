import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import { postBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography'
import withErrorBoundary from '../common/withErrorBoundary'

const styles = theme => ({
  postContent: postBodyStyles(theme),
  root: {
    maxWidth: 640,
    margin:10,
  },
  author: {
    ...postBodyStyles(theme)
  },
  footer: {
    marginTop: theme.spacing.unit*4,
    textAlign: "right"
  },
  separator: {
    borderColor: theme.palette.grey[200],
    width: "25%",
    marginTop: theme.spacing.unit*4,
    marginBottom: theme.spacing.unit*8
  },
  menu: {
    float: "right",
    marginLeft: theme.spacing.unit,
  }
})

class Answer extends Component {
  state = { showEdit: false }

  showEdit = () => this.setState({showEdit: true})
  hideEdit = () => this.setState({showEdit: false})

  render () {
    const { comment, post, classes } = this.props
    const { showEdit } = this.state
    const { ContentItemBody, AnswerMeta, SimpleDate, AnswerCommentsList } = Components

    return (
      <Components.Section titleComponent={<AnswerMeta comment={comment} post={post} showEdit={this.showEdit}/>}>
        <div className={classes.root}>
          { showEdit ?
            <Components.CommentsEditForm
               comment={comment}
               successCallback={this.hideEdit}
               cancelCallback={this.hideEdit}
             />
          :
            <ContentItemBody
              className={classes.postContent}
              dangerouslySetInnerHTML={{__html:comment.htmlBody}}/>
          }
          <div className={classes.footer}>
            {comment && comment.user && <Typography variant="headline">by { comment.user.displayName}</Typography>}
            <Typography variant="subheading"><SimpleDate date={comment.postedAt}/></Typography>
          </div>
          <AnswerCommentsList
            terms={{view:"repliesToAnswer", parentAnswerId: comment._id, limit:3}}
            post={post}
            answerId={comment._id}
            />
        </div>
      </Components.Section>
    )
  }
}

Answer.propTypes = {
  comment: PropTypes.object.isRequired,
};

registerComponent('Answer', Answer, withStyles(styles, {name:'Answer'}), withErrorBoundary);
