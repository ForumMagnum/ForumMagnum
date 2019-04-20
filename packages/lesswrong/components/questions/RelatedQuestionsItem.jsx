import { Components, registerComponent, withMutation, getActions } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper.js';
import { Posts } from "../../lib/collections/posts";
import Tooltip from '@material-ui/core/Tooltip';
import withErrorBoundary from '../common/withErrorBoundary';
import Typography from '@material-ui/core/Typography';
import withUser from "../common/withUser";
import classNames from 'classnames';
import { connect } from 'react-redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import grey from '@material-ui/core/colors/grey';

export const MENU_WIDTH = 18
export const KARMA_WIDTH = 42
export const COMMENTS_WIDTH = 48

const COMMENTS_BACKGROUND_COLOR = grey[200]

const styles = (theme) => ({
  root: {
    display: "flex",
    position: "relative",
    width: "100%",
    '&:hover $actions': {
      opacity: .2,
    }
  },
  postsItem: {
    display: "flex",
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    alignItems: "center",
    flexWrap: "wrap",
  },
  background: {
    transition: "3s",
    backgroundColor: "none",
    width: "100%",
  },
  commentsBackground: {
    backgroundColor: COMMENTS_BACKGROUND_COLOR,
    transition: "0s",
  },
  commentBox: {
    borderLeft: "solid 1px rgba(0,0,0,.2)",
    borderRight: "solid 1px rgba(0,0,0,.2)",
    paddingBottom: 0,
    paddingLeft: theme.spacing.unit*2,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing.unit
    }
  },
  karma: {
    width: KARMA_WIDTH,
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 14,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "unset",
      marginLeft: 0,
      marginRight: theme.spacing.unit*2,
      flexGrow: 1
    }
  },
  firstItem: {
    borderTop: "solid 1px rgba(0,0,0,.2)"
  },
  title: {
    ...theme.typography.postStyle,
    fontSize: "1.3rem",
    flexGrow: 1,  
    [theme.breakpoints.down('sm')]: {
      order:-1,
      height: "unset",
      width: "100%",
      marginBottom: theme.spacing.unit,
      paddingRight: theme.spacing.unit
    },
  },
  newCommentsSection: {
    width: "100%",
    marginTop: theme.spacing.unit,
    padding: theme.spacing.unit*2,
    paddingLeft: 0,
    cursor: "pointer",
    [theme.breakpoints.down('sm')]: {
      padding: 0,
    }
  },
  closeComments: {
    color: theme.palette.grey[500],
    textAlign: "right",
  },
  postIcon: {
    display: "none",
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
  commentsIcon: {
    width: COMMENTS_WIDTH,
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    top: 2
  },
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -MENU_WIDTH,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    '&:hover': {
      opacity: 1
    },
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  actionsMenu: {
    position: "absolute",
    top: 0,
  },
  mobileActions: {
    cursor: "pointer",
    width: MENU_WIDTH,
    opacity: .5,
    marginRight: theme.spacing.unit,
    textAlign: "right",
    flexGrow: 1,
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
})

class RelatedQuestionsItem extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { showComments: false, readComments: false}
    this.postsItemRef = React.createRef();
  }

  toggleComments = (scroll) => {
    this.handleMarkAsRead()
    this.setState((prevState) => {
      if (scroll) {
        this.postsItemRef.current.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
      }
      return ({
        showComments:!prevState.showComments,
        readComments: true
      })
    })
  }

  async handleMarkAsRead () {
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
  }

  render() {
    const { classes, post, currentUser, index, parentQuestion } = this.props
    const { showComments, readComments } = this.state
    const { PostsItemComments, PostsItemKarma, PostsPageActions, PostsItemTooltip } = Components

    return (
      <div className={classes.root}>
        <div className={classNames(classes.background, {[classes.commentsBackground]: showComments,[classes.firstItem]: (index===0) && showComments, "personalBlogpost": !post.frontpageDate})}>
          <div className={classNames(classes.postsItem, {[classes.commentBox]: showComments})}>
            <div ref={this.postsItemRef}/>

            <PostsItemKarma post={post} />

            <Link to={Posts.getPageUrl(post)} className={classes.title}>
              <Tooltip title={<PostsItemTooltip post={post} author />} classes={{tooltip:classes.tooltip}} TransitionProps={{ timeout: 0 }} placement="left-start" enterDelay={0} PopperProps={{ style: { pointerEvents: 'none' } }}>
                <span>{parentQuestion && <span>[Parent]</span>} {post.title}</span>
              </Tooltip>
            </Link>

            {<div className={classes.mobileActions}>
              <PostsPageActions post={post} menuClassName={classes.actionsMenu} />
            </div>}

            <div className={classes.commentsIcon}>
              <PostsItemComments post={post} onClick={() => this.toggleComments(false)} readStatus={readComments}/>
            </div>

            {this.state.showComments && <div className={classes.newCommentsSection} onClick={() => this.toggleComments(true)}>
              <Components.PostsItemNewCommentsWrapper
                currentUser={currentUser}
                highlightDate={post.lastVisitedAt}
                terms={{view:"postCommentsUnread", limit:5, postId: post._id}}
                post={post}
              />
              <Typography variant="body2" className={classes.closeComments}><a>Close</a></Typography>
            </div>}
          </div>
          {<div className={classes.actions}>
            <PostsPageActions post={post} vertical menuClassName={classes.actionsMenu} />
          </div>}
        </div>
      </div>

    )
  }
}

RelatedQuestionsItem.propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired,
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
  'RelatedQuestionsItem',
  RelatedQuestionsItem,
  withMutation(mutationOptions),
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "RelatedQuestionsItem" }),
  withErrorBoundary,
  withUser
);
