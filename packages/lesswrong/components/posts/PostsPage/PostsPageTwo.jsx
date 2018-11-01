import {
  Components,
  getRawComponent,
  withDocument,
  registerComponent,
  getActions,
  withMutation } from 'meteor/vulcan:core';

import withNewEvents from '../../../lib/events/withNewEvents.jsx';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router'
import { Posts } from '../../../lib/collections/posts';
import { Comments } from '../../../lib/collections/comments'
import { withStyles } from '@material-ui/core/styles';
import { postBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'

const styles = theme => ({
    root: {
      position: 'relative',
      maxWidth: 650,
      minHeight: 200,
      fontSize: 20,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    header: {
      position: 'relative',
      marginBottom: 40,
    },
    voteTop: {
      position: 'absolute',
      fontSize: 42,
      left: -72,
      top: -6,
      textAlign: 'center',
    },
    postContent: postBodyStyles(theme),
    subtitle: {
      ...theme.typography.subtitle,
    },
    voteBottom: {
      position: 'relative',
      fontSize: 42,
      textAlign: 'center',
      display: 'inline-block'
    },
    postFooter: {
      marginBottom: 30,
    },
    draft: {
      color: theme.palette.secondary.light
    },
    recommendedReading: {
      width: 640,
      margin: 'auto',
      [theme.breakpoints.down('sm')]: {
        width:'100%'
      }
    },
    moderationGuidelinesWrapper: {
      width: 'calc(100% - 50px)',
      verticalAlign: 'top',
      marginTop: 15,
      display: 'inline-block',
      fontSize: 16
    }
})

class PostsPage extends Component {

  render() {
    const { loading, document, currentUser, location, router, classes, params } = this.props
    const { PostsPageTitle, PostsAuthors, HeadTags, PostsVote, SmallMapPreviewWrapper,
      LinkPostMessage, PostsCommentsThread, Loading, Error404, PostsGroupDetails, RecommendedReadingWrapper,
      PostsTopSequencesNav, PostsPageMetadata, ModerationGuidelinesBox } = Components

    if (loading) {
      return <div><Loading/></div>
    } else if (!document) {
      return <Error404/>
    } else {
      const post = document
      let query = location && location.query
      const view = _.clone(router.location.query).view || Comments.getDefaultView(post, currentUser)
      const description = post.plaintextExcerpt ? post.plaintextExcerpt : (post.body && post.body.substring(0, 300))
      const commentTerms = _.isEmpty(query && query.view) ? {view: view, limit: 500} : {...query, limit:500}
      const sequenceId = params.sequenceId || post.canonicalSequenceId;

      return (
        <div className={classes.root}>
          <HeadTags url={Posts.getPageUrl(post, true)} title={post.title} description={description}/>

          {/* Header/Title */}
          <div className={classes.header}>
            <PostsPageTitle post={post} />
            <div className={classes.voteTop}>
              <PostsVote collection={Posts} post={post} currentUser={currentUser}/>
            </div>
            {post.groupId && <PostsGroupDetails post={post} documentId={post.groupId} />}
            <PostsTopSequencesNav post={post} sequenceId={sequenceId} />
            <PostsAuthors post={post}/>
          </div>

          {/* Body */}
          <div>
            <PostsPageMetadata post={post} />
            { post.isEvent && <SmallMapPreviewWrapper post={post} /> }
            <div className={classes.postContent}>
              <LinkPostMessage post={post} />
              { post.htmlBody && <div dangerouslySetInnerHTML={{__html: post.htmlBody}}/> }
            </div>
          </div>

          {/* Footer */}
          <div className={classes.postFooter}>
            <div className={classes.voteBottom}>
              <PostsVote collection={Posts} post={post} currentUser={currentUser}/>
            </div>
            <div className={classes.moderationGuidelinesWrapper}>
              <ModerationGuidelinesBox documentId={post._id} showModeratorAssistance />
            </div>
          </div>
          {sequenceId && <div className={classes.recommendedReading}>
            <RecommendedReadingWrapper documentId={sequenceId} post={post}/>
          </div>}

          {/* Comments Section */}
          <div id="comments">
            <PostsCommentsThread terms={{...commentTerms, postId: post._id}} post={post}/>
          </div>

        </div>
      );
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
  enableTotal: false,
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
  withUser,
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
  withStyles(styles, { name: "PostsPage" }),
  // Add error boundary to post
  withErrorBoundary
);
