import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import { postBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography'
import withErrorBoundary from '../common/withErrorBoundary'
import { Comments } from '../../lib/collections/comments';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const styles = theme => ({
  postContent: postBodyStyles(theme),
  root: {
    maxWidth: 640,
  },
  author: {
    ...postBodyStyles(theme)
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
    left:-3
  },
  deletedSection: {
    borderTop: "solid 1px rgba(0,0,0,.2)",
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit
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
  }
})

class Answer extends Component {
  state = { showEdit: false }

  showEdit = () => this.setState({showEdit: true})
  hideEdit = () => this.setState({showEdit: false})

  render () {
    const { comment, post, classes } = this.props
    const { showEdit } = this.state
    const { ContentItemBody, SimpleDate, AnswerCommentsList, PostsVote, CommentsMenu } = Components

    return (
      <Components.Section>
        <div className={classes.root} id={comment._id}>
          { comment.deleted ?
            <div className={classes.deletedSection}>
              <Typography variant="body2" className={classes.deleted}>
                Answer was deleted
              </Typography>
            </div>
            :
            <div>
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
                {!comment.deleted && <div className={classes.footerVote}>
                  <PostsVote post={comment} collection={Comments}/>
                </div>}
                <div className={classes.footerRight}>
                  {comment && comment.user && <Typography variant="headline">
                    { comment.user.displayName}
                  </Typography>}
                  <Typography variant="subheading"><SimpleDate date={comment.postedAt}/></Typography>
                  <div className={classes.menu}>
                    <CommentsMenu
                      showEdit={showEdit}
                      comment={comment}
                      post={post}
                      icon={<MoreHorizIcon className={classes.menuIcon}/>}
                    />
                  </div>
                </div>
              </div>
              <AnswerCommentsList
                terms={{view:"repliesToAnswer", parentAnswerId: comment._id, limit:3}}
                post={post}
                parentAnswerId={comment._id}
                />
            </div>
          }

        </div>
      </Components.Section>
    )
  }
}

Answer.propTypes = {
  comment: PropTypes.object.isRequired,
};

registerComponent('Answer', Answer, withStyles(styles, {name:'Answer'}), withErrorBoundary);
