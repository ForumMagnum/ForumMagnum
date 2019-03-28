import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import { postBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography'
import withErrorBoundary from '../common/withErrorBoundary'
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import withUser from '../common/withUser'
import { Link } from 'react-router';
import { Posts } from "../../lib/collections/posts";
import Icon from '@material-ui/core/Icon';
import { ABRIDGE_COMMENT_COUNT } from './AnswerCommentsList';

const styles = theme => ({
  postContent: postBodyStyles(theme),
  root: {
    maxWidth: 650,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  author: {
    display: 'inline-block',
    marginBottom: 10,
    fontWeight: 600,
  },
  date: {
    display: 'inline-block',
    marginLeft: 10
  },
  vote: {
    display: 'inline-block',
    marginLeft: 10,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.grey[500]
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
    position: "relative",
    top:7,
    marginLeft: 10
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
  bottomDivider: {
    marginTop: 50,
    marginBottom: 50,
    border: "solid 1px rgba(0,0,0,.1)",
    borderBottom: 'transparent'
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
    const { comment, post, classes, index, answerCount } = this.props
    const { showEdit } = this.state
    const { ContentItemBody, FormatDate, AnswerCommentsList, CommentsMenu, UsersName } = Components
    const { html = "" } = comment.contents || {}

    return (
      <div className={classes.root}>
        { comment.deleted ?
          <div className={classes.deletedSection} id={comment._id}>
            <Typography variant="body2" className={classes.deleted}>
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
            {comment.user && <Typography variant="headline" id={comment._id} className={classes.author}>
              { <UsersName user={comment.user} />}
            </Typography >}
            <Typography variant="subheading" className={classes.date}>
              <Link to={Posts.getPageUrl(post) + "#" + comment._id}>
                <FormatDate date={comment.postedAt} format="MMM DD, YYYY"/>
                <Icon className="material-icons comments-item-permalink"> link </Icon>
              </Link>
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
            <AnswerCommentsList
              terms={{view:"repliesToAnswer", parentAnswerId: comment._id, limit: ABRIDGE_COMMENT_COUNT}}
              post={post}
              parentAnswer={comment}
              />
          </div>
        }
      {(index !== (answerCount-1)) && <hr className={classes.bottomDivider}/>}
      </div>
    )
  }
}

Answer.propTypes = {
  comment: PropTypes.object.isRequired,
};

registerComponent('Answer', Answer, withStyles(styles, {name:'Answer'}), withErrorBoundary, withUser);