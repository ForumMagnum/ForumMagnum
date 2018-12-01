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
import { postBodyStyles, commentBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import Hidden from '@material-ui/core/Hidden';
import classNames from 'classnames';
import moment from 'moment';

const styles = theme => ({
    root: {
      position: "relative",
    },
    post: {
      maxWidth: 650,
      [theme.breakpoints.down('md')]: {
        margin: "auto"
      }
    },
    header: {
      position: 'relative',
      marginBottom: 50,
      [theme.breakpoints.down('sm')]: {
        marginBottom: 0
      }
    },
    eventHeader: {
      marginBottom:0,
    },
    secondaryInfo: {
      fontSize: '1.4rem',
      width: 'calc(100% - 60px)',
    },
    voteTop: {
      position: 'absolute',
      fontSize: 42,
      left: -72,
      top: -6,
      textAlign: 'center',
    },
    mobileVote: {
      position: 'absolute',
      top: -14,
      right: 0,
      fontSize: 42,
      display: 'inline-block',
      textAlign: 'center',
    },
    mobileDate: {
      marginLeft: 20,
      display: 'inline-block',
      color: theme.palette.grey[600]
    },
    mobileActions: {
      display: 'inline-block',
      marginLeft: 15,
      color: theme.palette.grey[600],
    },
    mobileDivider: {
      width: '60%',
      marginTop: 20,
      marginLeft: 0,
      borderColor: theme.palette.grey[100]
    },
    postBody: {
      marginBottom: 50,
    },
    postContent: postBodyStyles(theme),
    subtitle: {
      ...theme.typography.subtitle,
    },
    voteBottom: {
      position: 'relative',
      fontSize: 42,
      textAlign: 'center',
      display: 'inline-block',
      marginLeft: 8,
      marginRight: 8,
    },
    postFooter: {
      padding: '10px 0px',
      borderTop: '1px solid rgba(0,0,0,0.2)',
      borderBottom: '1px solid rgba(0,0,0,0.2)',
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
      width: 'calc(100% - 70px)',
      verticalAlign: 'top',
      display: 'inline-block',
      ...commentBodyStyles(theme)
    },
    inline: {
      display: 'inline-block'
    },

})

class PostsPage extends Component {

  render() {
    const { loading, document, currentUser, location, router, classes, params } = this.props
    const { PostsPageTitle, PostsAuthors, HeadTags, PostsVote, SmallMapPreviewWrapper,
      LinkPostMessage, PostsCommentsThread, Loading, Error404, PostsGroupDetails, RecommendedReadingWrapper,
      PostsTopSequencesNav, ModerationGuidelinesBox, FromNowDate,
      PostsPageActions, PostsPageEventData, ContentItemBody, AnswersSection, Section, TableOfContents } = Components

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
      const sectionData = post.tableOfContents;
      const htmlWithAnchors = sectionData ? sectionData.html : post.htmlBody;
      const sections = sectionData ? sectionData.sections : null;

      return (
        <div className={classes.root}>
          <HeadTags url={Posts.getPageUrl(post, true)} title={post.title} description={description}/>

          {/* Header/Title */}
          <Section>
            <div className={classes.post}>
              <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}>
                <PostsTopSequencesNav post={post} sequenceId={sequenceId} />
                <PostsPageTitle post={post} />
                <span className={classes.mobileVote}>
                  <Hidden mdUp implementation="css">
                    <PostsVote collection={Posts} post={post} currentUser={currentUser}/>
                  </Hidden>
                </span>
                <Hidden smDown implementation="css">
                  <div className={classes.voteTop}>
                    <PostsVote collection={Posts} post={post} currentUser={currentUser}/>
                  </div>
                </Hidden>
                {post.groupId && <PostsGroupDetails post={post} documentId={post.groupId} />}
                <div className={classes.secondaryInfo}>
                  <span className={classes.inline}><PostsAuthors post={post}/></span>
                  <span>
                    <Hidden mdUp implementation="css">
                      <FromNowDate date={post.postedAt}/>
                    </Hidden>
                  </span>
                  <span>
                    <Hidden smDown implementation="css">
                      <span>{moment(post.postedAt).format("DD MMM YYYY")}</span>
                    </Hidden>
                  </span>
                  <span className={classes.mobileActions}>
                      <PostsPageActions post={post} />
                  </span>
                  <Components.GroupLinks document={post} />
                  <Hidden mdUp implementation="css">
                    <hr className={classes.mobileDivider} />
                  </Hidden>
                </div>
                {post.isEvent && <PostsPageEventData post={post}/>}

              </div>
            </div>
          </Section>
          <Section titleComponent={
            <TableOfContents sections={sections} document={document} />
          }>
            <div className={classes.post}>
              {/* Body */}
              <div className={classes.postBody}>


                { post.isEvent && <SmallMapPreviewWrapper post={post} /> }
                <div className={classes.postContent}>
                  <LinkPostMessage post={post} />
                  { post.htmlBody && <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}}/> }
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
            </div>
          </Section>

          {/* Answers Section */}
          {post.question && <div id="answers">
            <AnswersSection terms={{...commentTerms, postId: post._id}} post={post}/>
          </div>}

          {/* Comments Section */}
          <div>
            <div id="comments"/>
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
