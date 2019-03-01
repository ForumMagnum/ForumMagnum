import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import { Posts } from "../../lib/collections/posts";
import Tooltip from '@material-ui/core/Tooltip';
import withTimezone from '../common/withTimezone';
import moment from 'moment';
import withErrorBoundary from '../common/withErrorBoundary';
import Typography from '@material-ui/core/Typography';
import withUser from "../common/withUser";
import classNames from 'classnames';

const styles = (theme) => ({
  root: {
    display: "flex",
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    alignItems: "center",
    flexWrap: "wrap"
  },
  commentBox: {
    borderLeft: "solid 1px rgba(0,0,0,.2)",
    borderRight: "solid 1px rgba(0,0,0,.2)",
    backgroundColor: theme.palette.grey[100],
    paddingBottom: 0,
  },
  karma: {
    width: 28,
    justifyContent: "center",
    marginLeft: 4,
    marginRight: theme.spacing.unit,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "flex-start",
      width: "unset",
      marginLeft: 0,
      marginRight: theme.spacing.unit*2
    }
  },
  title: {
    flexGrow:1,
    height: 22,
    maxWidth: 434,
    [theme.breakpoints.down('sm')]: {
      order:-1,
      height: "unset",
      marginBottom: theme.spacing.unit,
      flexGrow: "unset",
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
    marginRight: theme.spacing.unit*2,
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
    justifyContent: "center"
  },
  newCommentsSection: {
    width: "100%",
    marginTop: theme.spacing.unit,
    padding: theme.spacing.unit*2,
    cursor: "pointer",
    '&:hover': {
      backgroundColor: theme.palette.grey[300]
    }
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

const DateWithoutTime = withTimezone(
  ({date, timezone}) =>
    <span>{moment(date).tz(timezone).format("MMM Do")}</span>
);

class PostsItem2 extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { showComments: false}
  }


  toggleComments = () => {
    this.setState((prevState)=> ({showComments:!prevState.showComments}))
  }

  render() {
    const { classes, post, chapter, currentUser } = this.props
    const { showComments } = this.state
    const { PostsItemComments, PostsItemKarma, PostsItemMetaInfo, PostsItemTitle, PostsUserAndCoauthors, FormatDate, EventVicinity, EventTime, PostsItemCuratedIcon, PostsItemAlignmentIcon } = Components

    const getPostLink = () => {
      return chapter ? ("/s/" + chapter.sequenceId + "/p/" + post._id) : Posts.getPageUrl(post)
    }

    return (
        <div className={classNames(classes.root, {[classes.commentBox]: showComments})}>

          <PostsItemKarma post={post} />

          <Link to={getPostLink} className={classes.title}>
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
              ? <Tooltip title={<EventTime post={post} />}>
                  <DateWithoutTime date={post.startTime} />
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
    )
  }
}

registerComponent('PostsItem2', PostsItem2, withStyles(styles, { name: 'PostsItem2'}), withErrorBoundary, withUser);
