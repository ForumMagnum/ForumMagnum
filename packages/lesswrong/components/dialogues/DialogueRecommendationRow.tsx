import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { gql, useQuery } from '@apollo/client';
import { DialogueUserRowProps, TagWithCommentCount } from '../users/DialogueMatchingPage';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

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
  },
  reactIcon: {
    paddingRight: "4px",
  },
  suggestionRow: {
    display: 'flex',
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
    }
  }
});

interface DialogueRecommendationRowProps {
  rowProps: DialogueUserRowProps<boolean>; 
  classes: ClassesType<typeof styles>; 
  showSuggestedTopics: boolean;
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

const DialogueRecommendationRow = ({ rowProps, classes, showSuggestedTopics }: DialogueRecommendationRowProps) => {
  const { DialogueCheckBox, UsersName, PostsItem2MetaInfo, ReactionIcon, PostsTooltip } = Components

  const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const currentUser = useCurrentUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    captureEvent("toggle_expansion_reciprocity")
  };

  const { loading, error, data: topicData } = useQuery(gql`
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
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit:4 },
    skip: !currentUser
  });

  const { loading: tagLoading, error: tagError, data: tagData } = useQuery(gql`
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
  });

  const { loading: postsLoading, error: postsError, data: postsData } = useQuery(gql`
    query UsersReadPostsOfTargetUser($userId: String!, $targetUserId: String!, $limit: Int) {
      UsersReadPostsOfTargetUser(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        title
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUser._id, limit : 3 },
  });

  const topTags:[TagWithCommentCount] = tagData?.UserTopTags;
  const readPosts:DbPost[] = postsData?.UsersReadPostsOfTargetUser
  const preTopicRecommendations: TopicRecommendationWithContents[] | undefined = topicData?.GetTwoUserTopicRecommendations; 
  const topicRecommendations = preTopicRecommendations?.filter(topic => ['agree', 'disagree'].includes(topic.theirVote) ); // todo: might want better type checking here in future for values of theirVote
 
  if (!currentUser || !topTags || !topicRecommendations || !readPosts) return <></>;
  const tagsSentence = topTags.slice(0, 4).map(tag => tag.tag.name).join(', ');
  const numRecommendations = topicRecommendations?.length + readPosts?.length + 1 ?? 0;
  const numShown = isExpanded ? numRecommendations : 2
  const numHidden = Math.max(0, numRecommendations - numShown);

  const getTopicSuggestion = (reactIconName:string, prefix:string, Content:JSX.Element) => {
    return (
      <div className={classes.suggestionRow}>
        <p className={classNames({
          [classes.debateTopicExpanded]: isExpanded,
          [classes.debateTopicCollapsed]: !isExpanded
        })}>
            <ReactionIcon key={"1"} size={13} react={reactIconName} />
            {" "}
            <span key={"2"} className={classNames(classes.agreeText, { [classes.agreeTextCollapsedMobile]: !isExpanded})}>
              {prefix}
            </span>
            {Content}
        </p>
      </div>
    )
  }

  const allRecommendations:{reactIconName:string, prefix:string, Content:JSX.Element}[] = [
    ...topicRecommendations.map(topic => ({reactIconName: topic.theirVote, prefix: topic.theirVote+": ", Content: <>{topic.comment.contents.plaintextMainText}</>})), 
    {reactIconName: "elaborate", prefix: "top tags: ", Content: <>{tagsSentence}</>},
    ...readPosts.map(post => ({reactIconName: "seen", prefix: "you read: ", Content: <PostsTooltip postId={post._id}>
      <Link to={postGetPageUrl(post)}> {post.title} </Link>
    </PostsTooltip>}))
  ]

  const renderExpandCollapseText = () => {
    if (!allRecommendations || allRecommendations.length === 0) return '';
    if (isExpanded) {
      return '▲ hide';
    }  
    return [
      '▼',
      <span key={targetUser._id} className={classes.bigScreenExpandNote}>
        ...{numHidden > 0 ? ` ${numHidden} ` : ``}more
      </span>,
      ];
  };

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
        
        {showSuggestedTopics && <div className={classes.topicRecommendationsList}>
          {allRecommendations.slice(0, numShown).map( (item, index) => getTopicSuggestion(item.reactIconName, item.prefix, item.Content)) }
        </div>}
      {showSuggestedTopics && <div className={classes.dialogueRightContainer}>
        {<span className={classNames({
          [classes.hideIcon]: isExpanded,
          [classes.expandIcon]: !isExpanded
        })} onClick={toggleExpansion}>
          {renderExpandCollapseText()}
        </span>}
      </div>}
      {!showSuggestedTopics && 
        <PostsItem2MetaInfo className={classes.dialogueMatchNote}>
          <div className={classes.dialogueMatchNote}>Check to maybe dialogue, if you find a topic</div>
        </PostsItem2MetaInfo>}
      </div>
    </div>
  );
};

const DialogueRecommendationRowComponent = registerComponent('DialogueRecommendationRow', DialogueRecommendationRow, {styles});

declare global {
  interface ComponentTypes {
    DialogueRecommendationRow: typeof DialogueRecommendationRowComponent
  }
}
