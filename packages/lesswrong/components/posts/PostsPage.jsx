import {
  Components,
  getRawComponent,
  replaceComponent,
  withDocument,
  registerComponent,
  getActions,
  withCurrentUser,
  withMutation } from 'meteor/vulcan:core';

import withNewEvents from '../../lib/events/withNewEvents.jsx';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link, withRouter } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { Posts, Comments } from 'meteor/example-forum';
import moment from 'moment';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { postBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';

const styles = theme => ({
    header: {
      maxWidth: 650,
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: 40,
    },
    title: {
      textAlign: 'center',
      margin: '45px 0',
      ...theme.typography.display3,
      ...theme.typography.postStyle,
      color: theme.palette.text.primary,
    },
    voteTop: {
      position: 'relative',
      fontSize: 35,
      marginTop: -35,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    },
    voteDivider: {
      borderTopColor: theme.palette.grey[600],
      width: 80,
      WebkitMarginBefore: 0,
      WebkitMarginAfter: 0,
      WebkitMarginStart: 0,
      WebkitMarginEnd: 0
    },
    author: {
      marginTop: 18,
      textAlign: 'center',
    },
    mainContent: {
      position: 'relative',
      maxWidth: 650,
      minHeight: 200,
      fontSize: 20,
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: 40,
    },
    postContent: postBodyStyles(theme),
    linkPost: {
      marginBottom: theme.spacing.unit*2,
      paddingTop: 1,
      ...theme.typography.postStyle,
      '& > a': {
        color: theme.palette.secondary.light
      }
    },
    metadata: {
      ...theme.typography.postStyle,
    },
    subtitle: {
      ...theme.typography.subtitle,
    },
    voteBottom: {
      position: 'relative',
      fontSize: 45,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
    postFooter: {
      marginBottom: 30,
    },
    draft: {
      color: theme.palette.secondary.light
    }
})

class PostsPage extends Component {
  renderCommentViewSelector() {

    let views = ["top", "new"];
    const query = _.clone(this.props.router.location.query);

    return (
      <DropdownButton
        bsStyle="default"
        className="views btn-secondary"
        title={this.context.intl.formatMessage({id: "posts.view"})}
        id="views-dropdown"
      >
        {views.map(view =>
          <LinkContainer key={view} to={{pathname: this.props.router.location.pathname, query: {...query, view: view}}} className="dropdown-item">
            <MenuItem>
              { /* borrow the text from post views */ }
              <FormattedMessage id={"posts."+view}/>
            </MenuItem>
          </LinkContainer>
        )}
      </DropdownButton>
    )

  }

  getCommentCountStr = (post) => {
    let count = Posts.getCommentCount(post)

    if (!count) {
        return "No comments"
    } else if (count == 1) {
        return "1 comment"
    } else {
        return count + " comments"
    }
  }

  getNavTitle = () => {
    const post = this.props.document
    if (post && post.canonicalSequence && post.canonicalSequence.title) {
      return post.canonicalSequence.title
    } else if (post && post.canonicalBook && post.canonicalBook.title) {
      return post.canonicalBook.title
    } else if (post && post.canonicalCollection && post.canonicalCollection.title) {
      return post.canonicalCollection.title
    }
  }

  getNavTitleUrl = () => {
    const post = this.props.document
    if (post && post.canonicalSequence && post.canonicalSequence.title) {
      return "/s/" + post.canonicalSequenceId
    } else if (post && post.canonicalCollectionSlug) {
      return "/" + post.canonicalCollectionSlug
    }
  }

  renderSequenceNavigation = () => {
    const post = this.props.document
    const sequenceId = this.props.params.sequenceId || post.canonicalSequenceId;
    const canonicalCollectionSlug = post.canonicalCollectionSlug;
    const title = this.getNavTitle()
    const titleUrl = this.getNavTitleUrl()

    if (sequenceId && !canonicalCollectionSlug) {
      return (
        <Components.SequencesNavigation
          documentId={sequenceId}
          post={post} />
      )
    } else if (canonicalCollectionSlug && title && titleUrl) {
      return (
        <Components.CollectionsNavigation
                  title={ title }
                  titleUrl={ titleUrl }
                  nextPostSlug={ post.canonicalNextPostSlug }
                  prevPostSlug={ post.canonicalPrevPostSlug }
                  nextPostUrl={ post.canonicalNextPostSlug && "/" + post.canonicalCollectionSlug + "/" + post.canonicalNextPostSlug }
                  prevPostUrl={ post.canonicalPrevPostSlug && "/" + post.canonicalCollectionSlug + "/" + post.canonicalPrevPostSlug }
                />
      )
    }
  }

  renderPostDate = () => {
    const post = this.props.document;
    const { classes } = this.props
    const calendarFormat = {sameElse : 'MMMM Do YY, HH:mm'}
    if (post.isEvent) {
      return <div>
        <div className="posts-page-event-times">
          <span className="posts-page-event-times-start"> From: {post.startTime ? moment(post.startTime).calendar({}, calendarFormat): "TBD"} </span>
          {post.endTime && <span className="posts-page-event-times-start"> To: {moment(post.endTime).calendar({}, calendarFormat)} </span>}
        </div>
      </div>
    } else {
      return <div className={classes.subtitle}>
        {moment(post.postedAt).format('MMM D, YYYY')}
      </div>
    }
  }

  renderEventLocation = () => {
    const post = this.props.document;
    if (post.isEvent && post.location) {
      return <div className="posts-page-event-location">
        {post.location}
      </div>
    }
  }

  renderEventLinks = () => {
    const post = this.props.document;
    if (post.isEvent) {
      return <div className="posts-page-event-links">
        <Components.GroupLinks document={post} />
      </div>
    }
  }

  renderContactInfo = () => {
    const post = this.props.document;
    if (post.isEvent && post.contactInfo) {
      return <div className="posts-page-event-contact">
        Contact: {post.contactInfo}
      </div>
    }
  }

  renderPostMetadata = () => {
    const post = this.props.document;
    const { classes } = this.props
    return <div className={classNames("posts-page-content-body-metadata", classes.metadata)}>
      <div className="posts-page-content-body-metadata-date">
        {this.renderPostDate()}
        {this.renderEventLocation()}
        {this.renderEventLinks()}
        {this.renderContactInfo()}
      </div>
      <div className="posts-page-content-body-metadata-comments">
        <a href="#comments">{ this.getCommentCountStr(post) }</a>
      </div>
      <div className="posts-page-content-body-metadata-actions">
        {Posts.options.mutations.edit.check(this.props.currentUser, post) &&
          <div className="posts-page-content-body-metadata-action">
            <Link to={{pathname:'/editPost', query:{postId: post._id, eventForm: post.isEvent}}}>
              Edit
            </Link>
          </div>
        }
        <Components.PostsPageAdminActions post={post} />
        {/* {Users.canDo(this.props.currentUser, "posts.edit.all") ?
          <div className="posts-page-content-body-metadata-action">
            <Components.DialogGroup title="Stats" trigger={<Link>Stats</Link>}>
          <Components.PostVotesInfo documentId={ post._id } />
            </Components.DialogGroup>
          </div> : null
        } */}
      </div>
    </div>
  }

  render() {
    const { loading, document, currentUser, location, router, classes } = this.props
    if (loading) {
      return <div><Components.Loading/></div>
    } else if (!document) {
      return <div><FormattedMessage id="app.404"/></div>
    } else {

      // IBETA FORUM
      if (!currentUser) return <p>Please log in to see content during internal beta</p>

      const post = document
      const htmlBody = {__html: post.htmlBody}
      let query = location && location.query
      const view = _.clone(router.location.query).view || Comments.getDefaultView(post, currentUser)

      const commentTerms = _.isEmpty(query) ? {view: view, limit: 500} : {...query, limit:500}

      return (
        <Components.ErrorBoundary>
          <Components.HeadTags url={Posts.getPageUrl(post, true)} title={post.title} description={post.excerpt} />
          <div>
            <div className={classes.header}>
              <Typography variant="display3" className={classes.title}>
                {post.draft && <span className={classes.draft}>[Draft] </span>}
                {post.title}
              </Typography>
              {post.groupId && <Components.PostsGroupDetails post={post} documentId={post.groupId} />}
              <Components.ErrorBoundary>
                { this.renderSequenceNavigation() }
              </Components.ErrorBoundary>
              <div className={classes.voteTop}>
                <hr className={classes.voteDivider}/>
                <Components.ErrorBoundary>
                  <Components.PostsVote collection={Posts} post={post} currentUser={currentUser}/>
                </Components.ErrorBoundary>
                <hr className={classes.voteDivider}/>
              </div>
              <Typography variant="title" color="textSecondary" className={classes.author}>
                {!post.user || post.hideAuthor ? '[deleted]' : <Components.UsersName user={post.user} />}
              </Typography>
            </div>
            <div className={classes.mainContent}>
              <Components.ErrorBoundary>
                {this.renderPostMetadata()}
              </Components.ErrorBoundary>
              <Components.ErrorBoundary>
                { post.isEvent && <Components.SmallMapPreviewWrapper post={post} /> }
              </Components.ErrorBoundary>
              { post.url && <Typography variant="body2" color="textSecondary" className={classes.linkPost}>
                This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link>
              </Typography>}
              { post.htmlBody && <div className={classes.postContent} dangerouslySetInnerHTML={htmlBody}></div> }
            </div>
            <div className={classes.postFooter}>
              <div className={classes.voteBottom}>
                <Components.ErrorBoundary>
                  <Components.PostsVote collection={Posts} post={post} currentUser={currentUser}/>
                </Components.ErrorBoundary>
              </div>
              <Typography variant="headline" color="textSecondary" className={classes.author}>
                {!post.user || post.hideAuthor ? '[deleted]' : <Components.UsersName user={post.user} />}
              </Typography>
            </div>
          </div>
          {this.renderRecommendedReading()}
          <div id="comments">
            <Components.ErrorBoundary>
              <Components.PostsCommentsThread terms={{...commentTerms, postId: post._id}} post={post}/>
            </Components.ErrorBoundary>
          </div>
        </Components.ErrorBoundary>
      );
    }
  }

  renderRecommendedReading = () => {
    const post = this.props.document;
    const sequenceId = this.props.params.sequenceId || post.canonicalSequenceId;
    if (sequenceId) {
      return <div className="posts-page-recommended-reading">
        <Components.ErrorBoundary>
          <Components.RecommendedReadingWrapper documentId={sequenceId} post={post}/>
        </Components.ErrorBoundary>
      </div>
    }
  }

  async componentDidMount() {
    try {

      // destructure the relevant props
      const {
        // from the parent component, used in withDocument, GraphQL HOC
        documentId,
        // from connect, Redux HOC
        setViewed,
        postsViewed,
        // from withMutation, GraphQL HOC
        increasePostViewCount,
      } = this.props;

      // a post id has been found & it's has not been seen yet on this client session
      if (documentId && !postsViewed.includes(documentId)) {

        // trigger the asynchronous mutation with postId as an argument
        await increasePostViewCount({postId: documentId});

        // once the mutation is done, update the redux store
        setViewed(documentId);
      }

      //LESSWRONG: register page-visit event
      if(this.props.currentUser) {
        const registerEvent = this.props.registerEvent;
        const currentUser = this.props.currentUser;
        const eventProperties = {
          userId: currentUser._id,
          important: false,
          intercom: true,
        };

        if(this.props.document) {
          eventProperties.documentId = this.props.document._id;
          eventProperties.postTitle = this.props.document.title;
        } else if (this.props.documentId){
          eventProperties.documentId = this.props.documentId;
        }
        registerEvent('post-view', eventProperties);
      }
    } catch(error) {
      console.log("PostPage componentDidMount error:", error); // eslint-disable-line
    }
  }
}
PostsPage.displayName = "PostsPage";

PostsPage.propTypes = {
  documentId: PropTypes.string,
  document: PropTypes.object,
  postsViewed: PropTypes.array,
  setViewed: PropTypes.func,
  increasePostViewCount: PropTypes.func,
}

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'LWPostsPage',
  totalResolver: false,
  enableCache: true,
  ssr: true
};

const mutationOptions = {
  name: 'increasePostViewCount',
  args: {postId: 'String'},
};

const mapStateToProps = state => ({ postsViewed: state.postsViewed });
const mapDispatchToProps = dispatch => bindActionCreators(getActions().postsViewed, dispatch);

registerComponent(
  // component name used by Vulcan
  'PostsPage',
  // React component
  PostsPage,
  // HOC to give access to the current user
  withCurrentUser,
  // HOC to give access to LW2 event API
  withNewEvents,
  // HOC to give access to router and params
  withRouter,
  // HOC to load the data of the document, based on queryOptions & a documentId props
  [withDocument, queryOptions],
  // HOC to provide a single mutation, based on mutationOptions
  withMutation(mutationOptions),
  // HOC to give access to the redux store & related actions
  connect(mapStateToProps, mapDispatchToProps),
  // HOC to add JSS styles to component
  withStyles(styles)
);
