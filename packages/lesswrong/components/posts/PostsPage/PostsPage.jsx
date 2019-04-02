import {
  Components,
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
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../../themes/stylePiping'
import withUser from '../../common/withUser';
import withErrorBoundary from '../../common/withErrorBoundary'
import classNames from 'classnames';
import { extractVersionsFromSemver } from '../../../lib/editor/utils'

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300

const styles = theme => ({
    root: {
      position: "relative"
    },
    post: {
      maxWidth: 650,
      [theme.breakpoints.down('md')]: {
        marginLeft: "auto",
        marginRight: "auto"
      }
    },
    header: {
      position: 'relative',
      display:"flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.unit*2
    },
    headerLeft: {
      width:"100%"
    },
    headerVote: {
      textAlign: 'center',
      fontSize: 42,
      position: "relative",
    },
    divider: {
      marginTop: theme.spacing.unit*2,
      marginBottom: theme.spacing.unit*2,
      marginLeft:0,
      borderTop: "solid 1px rgba(0,0,0,.1)",
      borderLeft: 'transparent'
    },
    eventHeader: {
      marginBottom:0,
    },
    secondaryInfo: {
      fontSize: '1.4rem',
    },
    mobileDate: {
      marginLeft: 20,
      display: 'inline-block',
      color: theme.palette.grey[600],
      fontSize: theme.typography.body2.fontSize,
      [theme.breakpoints.up('md')]: {
        display:"none"
      }
    },
    desktopDate: {
      marginLeft: 20,
      display: 'inline-block',
      color: theme.palette.grey[600],
      whiteSpace: "no-wrap",
      fontSize: theme.typography.body2.fontSize,
      [theme.breakpoints.down('sm')]: {
        display:"none"
      }
    },
    commentsLink: {
      marginLeft: 20,
      color: theme.palette.grey[600],
      whiteSpace: "no-wrap",
      fontSize: theme.typography.body2.fontSize,
    },
    actions: {
      display: 'inline-block',
      marginLeft: 15,
      cursor: "pointer",
      color: theme.palette.grey[600],
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
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingRight: 50,
      marginBottom: 40
    },
    draft: {
      color: theme.palette.secondary.light
    },
    bottomNavigation: {
      width: 640,
      margin: 'auto',
      [theme.breakpoints.down('sm')]: {
        width:'100%'
      }
    },
    inline: {
      display: 'inline-block'
    },
    unreviewed: {
      fontStyle: "italic",
      color: theme.palette.grey[600],
      marginBottom: theme.spacing.unit*2,
      fontSize:".9em",
      maxWidth: "100%",
      overflowX: "hidden",
      textOverflow: "ellipsis",
      ...theme.typography.postStyle,
    },
    feedName: {
      fontSize: theme.typography.body2.fontSize,
      marginLeft: 20,
      display: 'inline-block',
      color: theme.palette.grey[600],
      [theme.breakpoints.down('sm')]: {
        display: "none"
      }
    },
    commentsSection: {
      minHeight: 'calc(70vh - 100px)',
      marginLeft: -67,
      [theme.breakpoints.down('sm')]: {
        paddingRight: 0,
        marginLeft: 0
      },
      // TODO: This is to prevent the Table of Contents from overlapping with the comments section. Could probably fine-tune the breakpoints and spacing to avoid needing this.
      background: "white",
      position: "relative"
    },
    footerSection: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '1.4em'
    },
    bottomDate: {
      color: theme.palette.grey[600]
    },
})

// On the server, use the 'url' library for parsing hostname out of feed URLs.
// On the client, we instead create an <a> tag, set its href, and extract
// properties from that. (There is a URL class which theoretically would work,
// but it doesn't have the hostname field on IE11 and it's missing entirely on
// Opera Mini.)
let URLClass = null;
if (Meteor.isServer) {
  URLClass = require('url').URL
}

function getHostname(url) {
  if (URLClass)
    return new URLClass(url).hostname;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}

class PostsPage extends Component {

  render() {
    const { loading, document: post, currentUser, location, router, classes, params } = this.props
    const { PostsPageTitle, PostsAuthors, HeadTags, PostsVote, SmallMapPreviewWrapper,
      LinkPostMessage, PostsCommentsThread, Loading, Error404, PostsGroupDetails, BottomNavigationWrapper,
      PostsTopSequencesNav, FormatDate, PostsPageActions, PostsPageEventData, ContentItemBody, PostsPageQuestionContent, Section, TableOfContents, PostsRevisionSelector, PostsRevisionMessage, AlignmentCrosspostMessage } = Components

    if (loading) {
      return <div><Loading/></div>
    } else if (!post) {
      return <Error404/>
    } else {
      const { html, plaintextDescription, markdown, wordCount = 0 } = post.contents || {}
      let query = location && location.query
      const view = _.clone(router.location.query).view || Comments.getDefaultView(post, currentUser)
      const description = plaintextDescription ? plaintextDescription : (markdown && markdown.substring(0, 300))
      const commentTerms = _.isEmpty(query.view) ? {view: view, limit: 500} : {...query, limit:500}
      const sequenceId = params.sequenceId || post.canonicalSequenceId;
      const sectionData = post.tableOfContents;
      const htmlWithAnchors = (sectionData && sectionData.html) ? sectionData.html : html
      const feedLink = post.feed && post.feed.url && getHostname(post.feed.url)
      const { major } = extractVersionsFromSemver(post.version)
      const hasMajorRevision = major > 1

      return (
        <div className={classes.root}>
          <HeadTags url={Posts.getPageUrl(post, true)} title={post.title} description={description}/>

          {/* Header/Title */}
          <Section>
            <div className={classes.post}>
              {post.groupId && <PostsGroupDetails post={post} documentId={post.groupId} />}
              <PostsTopSequencesNav post={post} sequenceId={sequenceId} />
              <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}
              >
                <div className={classes.headerLeft}>
                  <PostsPageTitle post={post} />
                  <div className={classes.secondaryInfo}>
                    <span className={classes.inline}>
                      <PostsAuthors post={post}/>
                    </span>
                    { post.feed && post.feed.user &&
                      <Tooltip title={`Crossposted from ${feedLink}`}>
                        <a href={`http://${feedLink}`} className={classes.feedName}>
                          {post.feed.nickname}
                        </a>
                      </Tooltip>
                    }
                    {!post.isEvent && <span className={classes.mobileDate}>
                      <FormatDate date={post.postedAt}/>
                    </span>}
                    {!post.isEvent && <span className={classes.desktopDate}>
                      {hasMajorRevision ? <PostsRevisionSelector post={post}/> : <FormatDate date={post.postedAt} format="Do MMM YYYY"/>}
                    </span>}
                    {post.types && post.types.length > 0 && <Components.GroupLinks document={post} />}
                    <a className={classes.commentsLink} href={"#comments"}>{ Posts.getCommentCountStr(post)}</a>
                    <span className={classes.actions}>
                        <PostsPageActions post={post} />
                    </span>
                  </div>
                </div>
                <div className={classes.headerVote}>
                  <PostsVote
                    collection={Posts}
                    post={post}
                    currentUser={currentUser}
                    />
                </div>
              </div>
              <hr className={classes.divider}/>
              {post.isEvent && <PostsPageEventData post={post}/>}
            </div>
          </Section>
          <Section titleComponent={
            <TableOfContents sectionData={sectionData} document={post} />
          }>
            <div className={classes.post}>
              {/* Body */}
              <div className={classes.postBody}>
                { post.isEvent && <SmallMapPreviewWrapper post={post} /> }
                <div className={classes.postContent}>
                  <AlignmentCrosspostMessage post={post} />
                  { post.authorIsUnreviewed && <div className={classes.unreviewed}>This post is awaiting moderator approval</div>}
                  <LinkPostMessage post={post} />
                  {query.revision && <PostsRevisionMessage post={post} />}
                  { html && <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}}/> }
                </div>
              </div>
            </div>

            {/* Footer */}
            {(wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
              <div className={classes.footerSection}>
                <div className={classes.voteBottom}>
                  <PostsVote
                    collection={Posts}
                    post={post}
                    currentUser={currentUser}
                    />
                </div>
              </div>}
            {sequenceId && <div className={classes.bottomNavigation}>
              <BottomNavigationWrapper documentId={sequenceId} post={post}/>
            </div>}
            {/* Answers Section */}
            {post.question && <div>
              <div id="answers"/>
              <PostsPageQuestionContent terms={{...commentTerms, postId: post._id}} post={post}/>
            </div>}
            {/* Comments Section */}
            <div className={classes.commentsSection}>
              <PostsCommentsThread terms={{...commentTerms, postId: post._id}} post={post} newForm={!post.question} guidelines={!post.question}/>
            </div>
          </Section>
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
  fragmentName: 'PostsRevision',
  enableTotal: false,
  enableCache: true,
  ssr: true,
  extraVariables: {
    version: 'String'
  }
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
