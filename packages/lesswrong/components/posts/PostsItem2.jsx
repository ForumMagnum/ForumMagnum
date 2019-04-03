import { Components, registerComponent, withMutation, getActions, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
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

import { SECTION_WIDTH } from '../common/SingleColumnSection';

export const MENU_WIDTH = 18
export const AUTHOR_WIDTH = 140
export const EVENT_WIDTH = 110
export const KARMA_WIDTH = 28
export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72
export const COMMENTS_WIDTH = 48
export const LIST_PADDING = 16

const TITLE_WIDTH = SECTION_WIDTH - AUTHOR_WIDTH - KARMA_WIDTH - POSTED_AT_WIDTH - COMMENTS_WIDTH - LIST_PADDING

const EVENT_TITLE_WIDTH =  SECTION_WIDTH - EVENT_WIDTH - KARMA_WIDTH - START_TIME_WIDTH - COMMENTS_WIDTH - LIST_PADDING

const styles = (theme) => ({
  root: {
    display: "flex",
    position: "relative",
    width: SECTION_WIDTH,
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
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
    width: SECTION_WIDTH - LIST_PADDING,
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    }
  },
  commentsBackground: {
    backgroundColor: theme.palette.grey[200],
    transition: "0s",
  },
  commentBox: {
    borderLeft: "solid 1px rgba(0,0,0,.2)",
    borderRight: "solid 1px rgba(0,0,0,.2)",
    paddingBottom: 0,
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
      marginRight: theme.spacing.unit*2
    }
  },
  firstItem: {
    borderTop: "solid 1px rgba(0,0,0,.2)"
  },
  title: {
    height: 22,
    maxWidth: TITLE_WIDTH,
    [theme.breakpoints.down('sm')]: {
      order:-1,
      height: "unset",
      marginBottom: theme.spacing.unit,
      maxWidth: "unset",
      width: "100%",
      paddingRight: theme.spacing.unit
    }
  },
  eventTitle: {
    maxWidth: EVENT_TITLE_WIDTH,
    [theme.breakpoints.down('sm')]: {
      maxWidth: "unset",
    }
  },
  author: {
    width: AUTHOR_WIDTH,
    justifyContent: "flex-end",
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "unset",
      maxWidth: AUTHOR_WIDTH,
      marginLeft: 0,
      flex: "unset"
    }
  },
  event: {
    width: EVENT_WIDTH,
    justifyContent: "flex-end",
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "unset",
      maxWidth: EVENT_WIDTH,
      marginLeft: 0,
      flex: "unset"
    }
  },
  postedAt: {
    '&&': {
      width: POSTED_AT_WIDTH,
      justifyContent: "center",
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        justifyContent: "flex-start",
        width: "none",
        flexGrow: 1,
      }
    }
  },
  startTime: {
    '&&': {
      width: START_TIME_WIDTH,
      justifyContent: "center",
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        justifyContent: "flex-start",
        width: "none",
        flexGrow: 1,
      }
    }
  },
  newCommentsSection: {
    width: "100%",
    marginTop: theme.spacing.unit,
    padding: theme.spacing.unit*2,
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
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
})

class PostsItem2 extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { showComments: false, readComments: false}
    this.postsItemRef = React.createRef();
  }

  toggleComments = () => {
    this.handleMarkAsRead()
    this.setState((prevState) => {
      this.postsItemRef.current.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
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

  isSticky = (post, terms) => {
    if (post && terms && terms.forum) {
      return (
        post.sticky ||
        (terms.af && post.afSticky) ||
        (terms.meta && post.metaSticky)
      )
    }
  }

  render() {
    const { classes, post, chapter, currentUser, index, terms } = this.props
    const { showComments, readComments } = this.state
    const { PostsItemComments, PostsItemKarma, PostsItemMetaInfo, PostsItemTitle, PostsUserAndCoauthors, FormatDate, EventVicinity, EventTime, PostsItemCuratedIcon, PostsItemAlignmentIcon, PostsPageActions } = Components

    const postLink = chapter ? ("/s/" + chapter.sequenceId + "/p/" + post._id) : Posts.getPageUrl(post)

    return (
      <div className={classes.root}>
        <div className={classNames(classes.background, {[classes.commentsBackground]: showComments,[classes.firstItem]: (index===0) && showComments, "personalBlogpost": !post.frontpageDate})}>
          <div className={classNames(classes.postsItem, {[classes.commentBox]: showComments})}>
            <div ref={this.postsItemRef}/>
            <PostsItemKarma post={post} />

            <Link to={postLink} className={classes.title}>
              <PostsItemTitle post={post} postItem2 read={post.lastVisitedAt} sticky={this.isSticky(post, terms)} />
            </Link>

            { post.user && !post.isEvent && <PostsItemMetaInfo className={classes.author}>
              <PostsUserAndCoauthors post={post}/>
            </PostsItemMetaInfo>}

            { post.isEvent && <PostsItemMetaInfo className={classes.event}>
              <EventVicinity post={post} />
            </PostsItemMetaInfo>}

            {post.postedAt && !post.isEvent && <PostsItemMetaInfo className={classes.postedAt}>
              <FormatDate date={post.postedAt}/>
            </PostsItemMetaInfo>}

            { post.isEvent && <PostsItemMetaInfo className={classes.startTime}>
              {post.startTime
                ? <Tooltip title={<span>Event starts at <EventTime post={post} /></span>}>
                    <FormatDate date={post.startTime} format={"MMM Do"}/>
                  </Tooltip>
                : <Tooltip title={<span>To Be Determined</span>}>
                    <span>TBD</span>
                  </Tooltip>}
            </PostsItemMetaInfo>}

            {<div className={classes.mobileActions}>
              <PostsPageActions post={post} menuClassName={classes.actionsMenu} />
            </div>}

            {post.curatedDate && <span className={classes.postIcon}><PostsItemCuratedIcon /></span> }
            {!getSetting('AlignmentForum', false) && post.af && <span className={classes.postIcon}><PostsItemAlignmentIcon /></span> }

            <div className={classes.commentsIcon}>
              <PostsItemComments post={post} onClick={this.toggleComments} readStatus={readComments}/>
            </div>

            {this.state.showComments && <div className={classes.newCommentsSection} onClick={this.toggleComments}>
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

PostsItem2.propTypes = {
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
  'PostsItem2',
  PostsItem2,
  withMutation(mutationOptions),
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "PostsItem2" }),
  withErrorBoundary,
  withUser
);
