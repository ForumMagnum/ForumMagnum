import {
  Components,
  registerComponent,
  withMutation,
  getActions,
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { Posts } from "../../lib/collections/posts";
import classNames from 'classnames';

import { bindActionCreators } from 'redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { connect } from 'react-redux';
import CommentIcon from '@material-ui/icons/ModeComment';
import Paper from '@material-ui/core/Paper';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import { postHighlightStyles } from '../../themes/stylePiping'
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import Typography from '@material-ui/core/Typography';
import { shallowEqual, shallowEqualExcept } from '../../lib/modules/utils/componentUtils';
import withErrorBoundary from '../common/withErrorBoundary'


const styles = theme => ({
  root: {
    ...theme.typography.postStyle,
    display: "flex",
    alignAtems: "stretch",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.03) !important",
    },
  },
  postsItem: {
    position: "relative",

    "&:hover": {
      backgroundColor: "rgba(0,0,0,.025) !important",
    },

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.3)",
    },
  },

  paperShowHighlight: {
    "&:hover": {
      backgroundColor: "white !important",
    }
  },
  contentShowHighlight: {
    background: "white !important",
  },

  highlight: {
    maxWidth:570,
    padding:theme.spacing.unit*2,
    ...postHighlightStyles(theme),
  },

  meta: {
    display: "block",
    color: "rgba(0,0,0,0.55)",
    width: "100%",
    maxWidth: 570,
    paddingBottom: 5,

    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",

    [legacyBreakpoints.maxTiny]: {
      width: 320,
      paddingLeft: 3,
    },
    "&:hover $showHighlightButton": {
      [theme.breakpoints.up('md')]: {
        opacity: 0.7,
      }
    },
    '&:hover $actions': {
      display: "inline-block",
      opacity: 0.5,
    }
  },

  content: {
    paddingLeft:10,
    paddingTop:10,
    width:"calc(100% - 100px)"
  },
  paperExpanded: {
    backgroundColor: 'inherit',
    outline: "solid 1px rgba(0,0,0,.15)",
    borderBottom: "none"
  },
  paperNotExpanded: {
    backgroundColor: 'inherit',
    outline: "none",
    borderBottom: "solid 1px rgba(0,0,0,.15)",
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:"30px",
    height:"30px",
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    marginTop:-3,
    transform:"translate(50%, -50%)",
    color:"white",
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle
  },
  noUnreadComments: {
    color: "rgba(0,0,0,.15)",
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  },

  recentCommentsTitle: {
    padding: "10px 0",
    fontSize: 14,
    fontWeight: 600,
  },

  collapseIcon: {
    fontSize: "12px !important",
    height: 12,
    transform: "rotate(90deg)",
    marginRight: 5,
    top: 1,
    color: "rgba(0,0,0,.4) !important",
  },

  ////////////////////////////////////////////////////////////////////////////
  // Used for the highlight (in renderHighlightMenu, and the button)
  ////////////////////////////////////////////////////////////////////////////
  showHighlightButton: {
    opacity: 0,
    marginLeft: 4,
  },
  highlightFooter: {
    padding: "35px 0 0px",
    textAlign: "center",
    clear: "both",
    overflow: "auto",
  },

  highlightFooterButton: {
    color: "rgba(0,0,0,.6)",
    fontSize: "12px",
    cursor: "pointer",
    position: "absolute",
    padding: "10px 0",
    bottom: 0,
    background: "white",
    borderTop: "solid 1px rgba(0,0,0,.05)",

    "&:hover": {
      backgroundColor: "rgb(240,240,240)",
    }
  },
  hideHighlight: {
    position: "absolute",
    left: 0,
    textAlign: "center",
    width: "50%",
    borderRight: "solid 1px rgba(0,0,0,.05)",
  },
  viewFullPost: {
    right: 0,
    textAlign: "center",
    width: "50%",
  },

  ////////////////////////////////////////////////////////////////////////////
  // Used on the comments speech-bubble icon/button
  ////////////////////////////////////////////////////////////////////////////
  commentsSpeechBubble: {
    width: 50,
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,

    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.03) !important",
    }
  },
  newCommentsShown: {
    backgroundColor: "rgba(0,0,0,.05)",
  },
  highlightSelected: {
    borderLeft: "solid 1px rgba(0,0,0,.05)",
    backgroundColor: "rgba(0,0,0,.02)",
  },


  ////////////////////////////////////////////////////////////////////////////
  // Used in the New Comments view (when you click the comments icon)
  ////////////////////////////////////////////////////////////////////////////
  newCommentsSection: {
    backgroundColor: "rgba(0,0,0,.05)",
    padding: "7px 9px 50px 9px",
  },
  newCommentsHeader: {
  },
  newCommentsFooter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    left: 0,
  },
  newCommentsActions: {
    color: "rgba(0,0,0,.5)",
    fontSize: "12px",
    cursor: "pointer",
    padding: 10,
    "&:hover": {
      color: "rgba(0,0,0,.35)",
      backgroundColor: "rgba(0,0,0,.1)",
    }
  },
  hideComments: {
    float: "left",
    textAlign: "center",
    width: "50%",
    borderRight: "solid 1px rgba(0,0,0,.05)",
  },
  viewAllComments: {
    float: "right",
    right: 0,
    textAlign: "center",
    width: "50%",
  },
  actions: {
    display: "inline-block",
    opacity: 0,
    marginTop: -5,
    '&:hover': {
      opacity: 1
    },
  }
})

const isSticky = (post, terms) => {
  if (post && terms && terms.forum) {
    return (
      post.sticky ||
      (terms.af && post.afSticky) ||
      (terms.meta && post.metaSticky)
    )
  }
}

class PostsItem extends Component {
  constructor(props, context) {
    super(props)
    this.state = {
      categoryHover: false,
      showNewComments: false,
      readStatus: false,
    }
  }

  toggleNewComments = () => {
    this.handleMarkAsRead()
    this.setState({readStatus: true});
    this.setState({showNewComments: !this.state.showNewComments});
    this.setState({showHighlight: false});
  }
  toggleHighlight = () => {
    this.handleMarkAsRead()
    this.setState({readStatus: true});
    this.setState({showHighlight: !this.state.showHighlight});
    this.setState({showNewComments: false});
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!shallowEqual(this.state, nextState)) {
      return true;
    }

    // Deep compare rather than shallow compare 'terms', because it gets reconstructed but is simple
    if (!_.isEqual(this.props.terms, nextProps.terms)) {
      return true;
    }

    // Exclude mutators from comparison
    if (!shallowEqualExcept(this.props, nextProps, ["terms", "increasePostViewCount", "createLWEvent", "newMutation"])) {
      return true;
    }

    return false;
  }


  async handleMarkAsRead () {
    // try {
      const {
        // from the parent component, used in withDocument, GraphQL HOC
        // from connect, Redux HOC
        setViewed,
        postsViewed,
        post,
        // from withMutation, GraphQL HOC
        increasePostViewCount,
      } = this.props;
      // a post id has been found & it's has not been seen yet on this client session
      if (post && post._id && postsViewed && !postsViewed.includes(post._id)) {

        // trigger the asynchronous mutation with postId as an argument
        await increasePostViewCount({postId: post._id});

        // once the mutation is done, update the redux store
        setViewed(post._id);
      }

      //LESSWRONG: register page-visit event
      if (this.props.currentUser) {
        const eventProperties = {
          userId: this.props.currentUser._id,
          important: false,
          intercom: true,
        };

        eventProperties.documentId = post._id;
        eventProperties.postTitle = post.title;
        this.props.registerEvent('post-view', eventProperties)
      }
    // }
  }

  // Render the thing that appears when you click "Show Highlight"
  renderHighlightMenu = () => {
    let { classes, post } = this.props;
    const { wordCount = 0 } = post.contents || {}
    return (
      <div className={classes.highlightFooter}>
        <Typography variant="body1" className={classNames(classes.highlightFooterButton, classes.hideHighlight)} onClick={this.toggleHighlight}>
          <Icon className={classes.collapseIcon}>
            subdirectory_arrow_left
          </Icon>
          Collapse
        </Typography>
        <Link to={this.getPostLink()}>
        <Typography className={classNames(classes.highlightFooterButton, classes.viewFullPost)} variant="body1">
          Continue to Full Post {wordCount && <span> ({wordCount} words)</span>}
        </Typography>
        </Link>
      </div>
    )
  }

  getPostLink = () => {
   const {post, chapter} = this.props
   return chapter ? ("/s/" + chapter.sequenceId + "/p/" + post._id) : Posts.getPageUrl(post)
 }

  render() {

    const { post, currentUser, terms, classes } = this.props;
    const { lastVisitedAt } = post

    const { PostsPageActions } = Components

    const lastCommentedAt = Posts.getLastCommentedAt(post)

    let commentCount = Posts.getCommentCount(post)

    const renderCommentsButton = () => {
      const read = lastVisitedAt;
      const newComments = lastVisitedAt < lastCommentedAt;
      const commentsButtonClassnames = classNames(
        classes.commentsSpeechBubble,
        {
          [classes.newCommentsShown]: this.state.showNewComments,
          [classes.highlightSelected]: this.state.showHighlight
        }
      )

      let unreadCommentsClass = (read && newComments && !this.state.readStatus) ? classes.unreadComments : classes.noUnreadComments;

      return (
        <div onClick={this.toggleNewComments} className={commentsButtonClassnames}>
          <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
          <div className={classes.commentCount}>
            { commentCount }
          </div>
        </div>
      )
    }

    return (
        <Paper
          className={classNames(
            "posts-item",
            classes.postsItem,
            (this.state.showNewComments || this.state.showHighlight)
              ? classes.paperExpanded
              : classes.paperNotExpanded,
            { [classes.paperShowHighlight]: this.state.showHighlight }
          )}
          elevation={0}
          square={true}
        >
          <div className={classNames(
            classes.root,
            { [classes.contentShowHighlight]: this.state.showHighlight }
          )}>

            <div className={classes.content}>
              <Link to={this.getPostLink()}>
                <Components.PostsItemTitle post={post} sticky={isSticky(post, terms)} read={lastVisitedAt || this.state.readStatus}/>
              </Link>
              <div onClick={this.toggleHighlight} className={classes.meta}>
                <Components.PostsItemMeta post={post} read={lastVisitedAt || this.state.readStatus}/>
                <Components.ShowOrHideHighlightButton
                  className={classes.showHighlightButton}
                  open={this.state.showHighlight}/>
                <span className={classes.actions} onClick={(event)=>event.stopPropagation()}>
                  <PostsPageActions post={post}/>
                </span>
              </div>
            </div>
            <Components.CategoryDisplay
              onClick={this.toggleHighlight}
              post={post} read={lastVisitedAt || this.state.readStatus}/>

            { renderCommentsButton() }

          </div>
          { this.state.showHighlight &&
            <div className={classes.highlight}>
              <Components.PostsHighlight post={post} />
              { this.renderHighlightMenu() }
            </div>
          }

          { this.state.showNewComments &&
            <div className={classes.newCommentsSection}>
              <div className={classes.newCommentsHeader}>
                <Typography variant="body1" className={classNames(classes.hideComments, classes.newCommentsActions)} onClick={this.toggleNewComments}>
                  <Icon className={classes.collapseIcon}>
                    subdirectory_arrow_left
                  </Icon>
                  Collapse
                </Typography>
                <Typography variant="body1">
                  <Link className={classNames(classes.viewAllComments, classes.newCommentsActions)} to={this.getPostLink() + "#comments"}>
                    View All Comments
                  </Link>
                </Typography>
              </div>
              <Typography variant="body1" className={classes.recentCommentsTitle}>
                Recent Comments
              </Typography>
              <Components.PostsItemNewCommentsWrapper
                currentUser={currentUser}
                highlightDate={lastVisitedAt}
                terms={{view:"postCommentsUnread", limit:5, postId: post._id}}
                post={post}
              />
              <div className={classes.newCommentsFooter}>
                <Typography variant="body1" className={classNames(classes.hideComments, classes.newCommentsActions)} onClick={this.toggleNewComments}>
                  <Icon className={classes.collapseIcon}>
                    subdirectory_arrow_left
                  </Icon>
                  Collapse
                </Typography>
                <Typography variant="body1">
                  <Link className={classNames(classes.viewAllComments, classes.newCommentsActions)} to={this.getPostLink() + "#comments"}>
                    View All Comments
                  </Link>
                </Typography>
              </div>
            </div>
          }
        </Paper>
    )
  }
}

PostsItem.propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired,
  terms: PropTypes.object,
  postsViewed: PropTypes.array,
  setViewed: PropTypes.func,
  increasePostViewCount: PropTypes.func,
};

const mutationOptions = {
  name: 'increasePostViewCount',
  args: {postId: 'String'},
};

const mapStateToProps = state => ({ postsViewed: state.postsViewed });
const mapDispatchToProps = dispatch => bindActionCreators(getActions().postsViewed, dispatch);

registerComponent(
  'PostsItem',
  PostsItem,
  withMutation(mutationOptions),
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "PostsItem" }),
  withErrorBoundary
);
