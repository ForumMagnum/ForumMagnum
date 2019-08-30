import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import { postHighlightStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography'
import withErrorBoundary from '../common/withErrorBoundary'
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import withUser from '../common/withUser'
import { ABRIDGE_COMMENT_COUNT } from './AnswerCommentsList';

const styles = theme => ({
  postContent: {
    ...postHighlightStyles(theme),
  },
  root: {
    marginBottom: theme.spacing.unit*4,
    paddingTop: theme.spacing.unit*2.5,
    paddingLeft: theme.spacing.unit*2.5,
    paddingRight: theme.spacing.unit*2.5,
    border: `solid 2px ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  answer: {

  },
  answerHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing.unit*2
  },
  author: {
    display: 'inline-block',
    fontWeight: 600,
    ...theme.typography.postStyle
  },
  date: {
    display: 'inline-block',
    marginLeft: 10,
  },
  vote: {
    display: 'inline-block',
    marginLeft: 10,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.grey[500],
    flexGrow: 1,
    position: "relative",
    top: -4
  },
  footer: {
    marginTop: 5,
    marginLeft: -13,
    display:"flex",
    alignItems:"center",
  },
  separator: {
    borderColor: theme.palette.grey[200],
    width: "25%",
    marginTop: theme.spacing.unit*4,
    marginBottom: theme.spacing.unit*8
  },
  menu: {
    opacity:.5,
    cursor: "pointer",
    '&:hover': {
      opacity:1
    },
  },
  deletedSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: 50
  },
  deleted: {
    color: theme.palette.grey[500]
  },
  footerVote: {
    fontSize: 42,
    textAlign: "center",
    marginRight: theme.spacing.unit
  },
  footerRight: {
    marginTop: theme.spacing.unit*2
  },
  newComment: {
    marginTop: theme.spacing.unit*2,
    color: theme.palette.grey[500]
  },
  metaData: {
    textAlign: 'right'
  },
})

class Answer extends Component {
  state = {
    showEdit: false,
    commenting: false,
  }

  showEdit = () => this.setState({showEdit: true})
  hideEdit = () => this.setState({showEdit: false})

  render () {
    const { comment, post, classes } = this.props
    const { showEdit } = this.state
    const { ContentItemBody, AnswerCommentsList, CommentsMenu, CommentsItemDate, UsersName } = Components
    const { html = "" } = comment.contents || {}

    return (
      <div className={classes.root}>
        { comment.deleted ?
          <div className={classes.deletedSection} id={comment._id}>
            <Typography variant="body1" className={classes.deleted}>
              Answer was deleted
            </Typography>
            <span className={classes.menu}>
              <CommentsMenu
                showEdit={this.showEdit}
                comment={comment}
                post={post}
                icon={<MoreHorizIcon className={classes.menuIcon}/>}
              />
            </span>
          </div>
          :
          <div>
            <div className={classes.answer}>
              <div className={classes.answerHeader}>
                {comment.user && <Typography variant="body2" id={comment._id} className={classes.author}>
                  { <UsersName user={comment.user} />}
                </Typography >}
                <Typography variant="subtitle1" className={classes.date}>
                  <CommentsItemDate comment={comment} post={post}/>
                </Typography>
                <span className={classes.vote}><Components.CommentsVote comment={comment}/></span>
                <span className={classes.menu}>
                  <CommentsMenu
                    showEdit={this.showEdit}
                    comment={comment}
                    post={post}
                    icon={<MoreHorizIcon className={classes.menuIcon}/>}
                  />
                </span>
              </div>
              { showEdit ?
                <Components.CommentsEditForm
                  comment={comment}
                  successCallback={this.hideEdit}
                  cancelCallback={this.hideEdit}
                />
                :
                <ContentItemBody
                  className={classes.postContent}
                  dangerouslySetInnerHTML={{__html:html}}
                />
              }
            </div>
            <AnswerCommentsList
              terms={{view:"repliesToAnswer", parentAnswerId: comment._id, limit: ABRIDGE_COMMENT_COUNT}}
              post={post}
              parentAnswer={comment}
              />
          </div>
        }
      </div>
    )
  }
}

Answer.propTypes = {
  comment: PropTypes.object.isRequired,
};

registerComponent('Answer', Answer, withStyles(styles, {name:'Answer'}), withErrorBoundary, withUser);
