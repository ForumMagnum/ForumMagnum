import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { gql } from '@apollo/client';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useSingle } from '../../lib/crud/withSingle';
import { truncatise } from '../../lib/truncatise';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { useQueryWrapped } from '@/lib/crud/useQuery';

const styles = (theme: ThemeType) => ({
  dialogueUserRow: { 
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.panelBackground.default,
    padding: 8,
    marginBottom: 3,
    borderRadius: 2,
  },
  dialogueUserRowExpandedMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  dialogueLeftContainer: {
    display: 'flex',
    maxWidth: '135px',
    minWidth: '135px',
    [theme.breakpoints.down('xs')]: {
      maxWidth: '110px',
      minWidth: '110px',
    },
    alignItems: 'center',
  },
  dialogueLeftContainerExpandedMobile: {
    [theme.breakpoints.down('xs')]: {
      marginBottom: '7px',
    }
  },
  dialogueLeftContainerNoTopics: {
    maxWidth: '200px',
    minWidth: '200px',
  },
  dialogueMatchUsername: {
    marginRight: 10,
    '&&': {
      color: theme.palette.text.primary,
      textAlign: 'left'
    },
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    width: 'auto',
    flexShrink: 'unset!important',
  },
  dialogueMatchUsernameExpandedMobile: {
    [theme.breakpoints.down('xs')]: {
      overflow: 'visible',
    }
  },
  dialogueMatchCheckbox: {
    marginLeft: 6,
    width: 29,
    '& label': {
      marginRight: 0
    }
  },
  debateTopicExpanded: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingBottom: '10px',
    whiteSpace: 'normal',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: '7px'
    }
  },
  debateTopicCollapsed: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingBottom: '5px',
  },
  reactIcon: {
    paddingRight: "4px",
  },
  suggestionRow: {
    display: 'flex',
    lineHeight: '1.15em',
  },
  agreeText: {
    color: theme.palette.text.dim3,
  },
  agreeTextCollapsedMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
  },
  topicRecommendationsList: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
    fontSize: 'small',
    overflow: 'hidden',
    justifyContent: 'space-between'
  },
  expandIcon: {
    cursor: 'pointer',
    minWidth: '70px',
    color: theme.palette.text.dim3,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 'auto',
      minWidth: '25px',
    },
  },
  hideIcon: {
    cursor: 'pointer',
    minWidth: '70px',
    [theme.breakpoints.down('xs')]: {
      marginLeft: 'auto',
      minWidth: '25px',
    },
    color: theme.palette.text.dim3,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  dialogueRightContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 'auto',
  },
  dialogueMatchNote: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  bigScreenExpandNote: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
  },
  caret: {
    fontSize: '0.83em',
  },
  commentSourcePost: {
    color: theme.palette.text.dim3,
  },
  closeIcon: { 
    color: theme.palette.grey[500],
    opacity: 0.5,
    padding: 2,
  },
});

export type PostYouveRead = {
  _id: string;
  title: string;
  slug: string;
}

export type RecommendedComment = {
  _id: string;
  postId: string;
  contents: {
    html: string;
    plaintextMainText: string;
  };
}

export type TagWithCommentCount = {
  tag: DbTag,
  commentCount: number
}

export interface DialogueUserResult {
  _id: string;
  displayName: string;
}

interface DialogueRecommendationRowProps {
  targetUser: DialogueUserResult;
  checkId: string | undefined;
  userIsChecked: boolean;
  userIsMatched: boolean;
  classes: ClassesType<typeof styles>; 
  showSuggestedTopics: boolean;
  onHide: ({ dialogueCheckId, targetUserId }: { dialogueCheckId: string|undefined; targetUserId: string; }) => void;
}

// Future TODO: unify this with the server type TopicRecommendation? The problem is that returns a whole DbComment, rather than just contents and id. 
interface TopicRecommendationWithContents {
  comment: {
    _id: string;
    contents: {
      html: string;
      plaintextMainText: string;
    };
  };
  recommendationReason: string;
  yourVote: string;
  theirVote: string;
}

interface TopicSuggestionProps {
  reactIconName: string; 
  prefix: string;
  Content: JSX.Element;
  classes: ClassesType<typeof styles>; 
  isExpanded: boolean;
}

export const TopicSuggestion = ({reactIconName, prefix, Content, classes, isExpanded}: TopicSuggestionProps) => {
  const { ReactionIcon } = Components
  return (
    <div className={classes.suggestionRow}>
      <p className={classNames({
        [classes.debateTopicExpanded]: isExpanded,
        [classes.debateTopicCollapsed]: !isExpanded
      })}>
          <ReactionIcon key="1" size={13} react={reactIconName} />
          {" "}
          <span key="2" className={classNames(classes.agreeText, { [classes.agreeTextCollapsedMobile]: !isExpanded})}>
            {prefix}
          </span>
          {Content}
      </p>
    </div>
  )
}

interface ExpandCollapseTextProps {
  classes: ClassesType<typeof styles>; 
  isExpanded: boolean;
  numHidden: number;
  toggleExpansion: () => void;
}

const ExpandCollapseText = ({classes, isExpanded, numHidden, toggleExpansion}: ExpandCollapseTextProps) => {
  let text 
  if (isExpanded) {
    text = <><span className={classes.caret}>▲</span> hide</>;
  } else {
    text = <>
      <span className={classes.caret} >▼</span><span key="1" className={classes.bigScreenExpandNote}>
        ...{numHidden > 0 ? ` ${numHidden} ` : ``}more
      </span>
    </>
  }
  return (
    <span className={classNames({
      [classes.hideIcon]: isExpanded,
      [classes.expandIcon]: !isExpanded
    })} onClick={toggleExpansion}>
      { text }
    </span>
  )
};

interface CommentViewProps {
  comment: RecommendedComment;
  classes: ClassesType<typeof styles>;
}

export const CommentView: React.FC<CommentViewProps> = ({ comment, classes }) => {
  const { PostsTooltip, Loading } = Components

  const { document: post, loading, error } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    documentId: comment.postId,
  });

  if (loading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <PostsTooltip postId={comment.postId} commentId={comment._id}>
      {truncatise(comment.contents.plaintextMainText, {
        TruncateLength: 200,
        TruncateBy: 'characters',
        Suffix: '...',
      })}
      <Link className={classes.commentSourcePost} to={postGetPageUrl(post)}> on "{post.title}" </Link> 
    </PostsTooltip>
  );
};

const DialogueRecommendationRow = ({ targetUser, checkId, userIsChecked, userIsMatched, classes, showSuggestedTopics, onHide }: DialogueRecommendationRowProps) => {
  const { DialogueCheckBox, UsersName, PostsItem2MetaInfo, Loading, PostsTooltip, CommentView } = Components
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const currentUser = useCurrentUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    captureEvent("toggle_expansion_reciprocity")
  };

  const { loading, error, data: topicData } = useQueryWrapped(gql`
    query getTopicRecommendations($userId: String!, $targetUserId: String!, $limit: Int!) {
      GetTwoUserTopicRecommendations(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        comment {
          _id
          contents {
            html
            plaintextMainText
          }
        }
        recommendationReason
        yourVote
        theirVote
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit: 4 },
    skip: !currentUser || !showSuggestedTopics
  });

  const { loading: tagLoading, error: tagError, data: tagData } = useQueryWrapped(gql`
    query UserTopTags($userId: String!) {
      UserTopTags(userId: $userId) {
        tag {
          name
          _id
        }
        commentCount
      }
    }
  `, {
    variables: { userId: targetUser._id },
    skip: !currentUser || !showSuggestedTopics
  });

  const { loading: postsLoading, error: postsError, data: postsData } = useQueryWrapped(gql`
    query UsersReadPostsOfTargetUser($userId: String!, $targetUserId: String!, $limit: Int!) {
      UsersReadPostsOfTargetUser(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        title
        slug
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit : 3 },
    skip: !currentUser || !showSuggestedTopics
  });

  const { loading: commentsLoading, error: commentsError, data: commentsData } = useQueryWrapped(gql`
    query UsersRecommendedCommentsOfTargetUser($userId: String!, $targetUserId: String!, $limit: Int!) {
      UsersRecommendedCommentsOfTargetUser(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        postId
        contents {
          html
          plaintextMainText
        }
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit : 2 },
    skip: !currentUser || !showSuggestedTopics
  });

  const topTags: TagWithCommentCount[] | undefined = tagData?.UserTopTags;
  const readPosts: PostYouveRead[] | undefined = postsData?.UsersReadPostsOfTargetUser
  const recommendedComments: RecommendedComment[] | undefined = commentsData?.UsersRecommendedCommentsOfTargetUser

  const preTopicRecommendations: TopicRecommendationWithContents[] | undefined = topicData?.GetTwoUserTopicRecommendations; 
  const topicRecommendations = preTopicRecommendations?.filter(topic => ['agree', 'disagree'].includes(topic.theirVote) ); // todo: might want better type checking here in future for values of theirVote
 
  if (!currentUser || !topTags || !topicRecommendations || !readPosts || !recommendedComments) return <Loading />;
  const tagsSentence = topTags.slice(0, 4).map(tag => tag.tag.name).join(', ');
  const numRecommendations = (topicRecommendations?.length ?? 0) + (readPosts?.length ?? 0) + (recommendedComments?.length ?? 0) + (tagsSentence === "" ? 0 : 1);
  const numShown = isExpanded ? numRecommendations : 2
  const numHidden = Math.max(0, numRecommendations - numShown);

  const allRecommendations: {reactIconName: string, prefix: string, Content: JSX.Element}[] = [
    ...topicRecommendations.map(topic => ({reactIconName: topic.theirVote, prefix: topic.theirVote+": ", Content: <>{topic.comment.contents.plaintextMainText}</>})), 
    {reactIconName: "examples", prefix: "top tags: ", Content: <>{tagsSentence}</>},
    ...readPosts.map(post => ({reactIconName: "elaborate", prefix: "post: ", Content: 
      <PostsTooltip postId={post._id}>
        <Link to={postGetPageUrl(post)}> {post.title} </Link>
      </PostsTooltip>})),
    ...recommendedComments.map(comment => ({reactIconName: "elaborate", prefix: "comment: ", Content: <CommentView comment={comment} />}))
  ]

  return (
    <div>
      <div key={targetUser._id} className={classNames(classes.dialogueUserRow, {
          [classes.dialogueUserRowExpandedMobile]: isExpanded
        })}>
        <div className={classNames(classes.dialogueLeftContainer, {
          [classes.dialogueLeftContainerExpandedMobile]: isExpanded,
          [classes.dialogueLeftContainerNoTopics]: numRecommendations === 0
        })}>
          <div className={ classes.dialogueMatchCheckbox }>
            <DialogueCheckBox
              targetUserId={targetUser._id}
              targetUserDisplayName={targetUser.displayName}
              checkId={checkId}
              isChecked={userIsChecked}
              isMatched={userIsMatched}
            />
          </div>
          <PostsItem2MetaInfo className={classNames(classes.dialogueMatchUsername, {
              [classes.dialogueMatchUsernameExpandedMobile]: isExpanded
            })}>
            <UsersName
              documentId={targetUser._id}
              simple={false}
            />
          </PostsItem2MetaInfo>
        </div>
        {showSuggestedTopics && (<>
          <div className={classes.topicRecommendationsList}>
            {allRecommendations.slice(0, numShown).map( (item, index) => <TopicSuggestion key={index} reactIconName={item.reactIconName} prefix={item.prefix} Content={item.Content} isExpanded={isExpanded} classes={classes}/>) } 
          </div>
          <div className={classes.dialogueRightContainer}>
            {(allRecommendations && allRecommendations.length > 0) && <ExpandCollapseText isExpanded={isExpanded} numHidden={numHidden} toggleExpansion={toggleExpansion} classes={classes} />}
          </div>
        </>)}
        {!showSuggestedTopics && 
          <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
            <div className={classes.dialogueMatchNote}>Check to maybe dialogue, if you find a topic</div>
          </PostsItem2MetaInfo>}
        <IconButton className={classes.closeIcon} onClick={() => onHide({dialogueCheckId: checkId, targetUserId: targetUser._id})}>
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  );
};

const DialogueRecommendationRowComponent = registerComponent('DialogueRecommendationRow', DialogueRecommendationRow, {styles});
const TopicSuggestionComponent = registerComponent('TopicSuggestion', TopicSuggestion, {styles});
const CommentViewComponent = registerComponent('CommentView', CommentView, {styles});
const ExpandCollapseComponent = registerComponent('ExpandCollapseText', ExpandCollapseText, {styles});


declare global {
  interface ComponentTypes {
    DialogueRecommendationRow: typeof DialogueRecommendationRowComponent,
    TopicSuggestion: typeof TopicSuggestionComponent,
    CommentView: typeof CommentViewComponent,
    ExpandCollapseText: typeof ExpandCollapseComponent,
  }
}
