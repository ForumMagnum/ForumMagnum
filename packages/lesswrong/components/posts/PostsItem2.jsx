import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import { Posts } from "../../lib/collections/posts";
import Tooltip from '@material-ui/core/Tooltip';
import withErrorBoundary from '../common/withErrorBoundary';
import Typography from '@material-ui/core/Typography';
import withUser from "../common/withUser";
import classNames from 'classnames';

const styles = (theme) => ({
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
    backgroundColor: "none"
  },
  commentsBackground: {
    backgroundColor: theme.palette.grey[200],
    transition: "0s",
  },
  commentBox: {
    borderLeft: "solid 1px rgba(0,0,0,.2)",
    borderRight: "solid 1px rgba(0,0,0,.2)",
    paddingBottom: 0,
  },
  karma: {
    width: 28,
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
    maxWidth: 432,
    [theme.breakpoints.down('sm')]: {
      order:-1,
      height: "unset",
      marginBottom: theme.spacing.unit,
      maxWidth: "unset",
      width: "100%",
      paddingRight: theme.spacing.unit
    }
  },
  authorOrEvent: {
    width:110,
    justifyContent: "flex-end",
    whiteSpace: "nowrap",
    marginLeft: "auto",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "unset",
      marginLeft: 0,
      flex: "unset"
    }
  },
  postedAt: {
    width: 38,
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "none",
      flexGrow: 1,
    }
  },
  startTime: {
    width: 54,
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "none",
      flexGrow: 1,
    }
  },
  newCommentsSection: {
    width: "100%",
    marginTop: theme.spacing.unit,
    padding: theme.spacing.unit*2,
    cursor: "pointer",
  },
  closeComments: {
    color: theme.palette.grey[500],
    textAlign: "right",
  },
  postIcon: {
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
})

class PostsItem2 extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { showComments: false}
    this.postsItemRef = React.createRef();
  }

  toggleComments = () => {
    this.setState((prevState) => {
      this.postsItemRef.current.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
      return ({showComments:!prevState.showComments})
    })
  }

  render() {
    const { classes, post, chapter, currentUser, index } = this.props
    const { showComments } = this.state
    const { PostsItemComments, PostsItemKarma, PostsItemMetaInfo, PostsItemTitle, PostsUserAndCoauthors, FormatDate, EventVicinity, EventTime, PostsItemCuratedIcon, PostsItemAlignmentIcon } = Components

    const postLink = chapter ? ("/s/" + chapter.sequenceId + "/p/" + post._id) : Posts.getPageUrl(post)

    return (
      <div className={classNames(classes.background, {[classes.commentsBackground]: showComments, [classes.firstItem]: (index===0) && showComments})}>
        <div className={classNames(classes.postsItem, {[classes.commentBox]: showComments})}>
          <div ref={this.postsItemRef}/>
          <PostsItemKarma post={post} />

          <Link to={postLink} className={classes.title}>
            <PostsItemTitle post={post} postItem2/>
          </Link>

          { post.user && !post.isEvent && <PostsItemMetaInfo className={classes.authorOrEvent}>
            <PostsUserAndCoauthors post={post}/>
          </PostsItemMetaInfo>}

          { post.isEvent && <PostsItemMetaInfo className={classes.authorOrEvent}>
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

          {post.curatedDate && <span className={classes.postIcon}><PostsItemCuratedIcon /></span> }
          {post.af && <span className={classes.postIcon}><PostsItemAlignmentIcon /></span> }

          <PostsItemComments post={post} onClick={this.toggleComments}/>

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
      </div>
    )
  }
}

registerComponent('PostsItem2', PostsItem2, withStyles(styles, { name: 'PostsItem2'}), withErrorBoundary, withUser);
