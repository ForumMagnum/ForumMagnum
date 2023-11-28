// TODO: Import component in components.ts
import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import {useCurrentUser} from '../common/withUser';
import {gql, useQuery} from '@apollo/client';
import {DialogueUserRowProps} from '../users/DialogueMatchingPage';

const styles = (theme: ThemeType) => ({
  dialogueUserRow: { // TODO; shared import
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.panelBackground.default,
    padding: 8,
    marginBottom: 3,
    borderRadius: 2,
  },
  dialogueLeftContainer: {
    display: 'flex',
    maxWidth: '135px',
    minWidth: '135px',
    alignItems: 'center',
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
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal'
    }
  },
  debateTopicCollapsed: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal',
      paddingBottom: '10px'
    },
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
  disagreeText: {
    color: theme.palette.text.dim3,
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
    color: 'grey',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  hideIcon: {
    cursor: 'pointer',
    minWidth: '70px',
    color: 'grey',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  dialogueRightContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: 10,
    marginRight: 3,
    marginLeft: 'auto',
  },
  dialogueMatchNote: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
});

interface DialogueRecommendationRowProps {
  rowProps: DialogueUserRowProps<boolean>; 
  classes: ClassesType<typeof styles>; 
  showSuggestedTopics: boolean;
}

const DialogueRecommendationRow = ({ rowProps, classes, showSuggestedTopics }: DialogueRecommendationRowProps) => {
  const { DialogueCheckBox, UsersName, PostsItem2MetaInfo, LWTooltip, ReactionIcon } = Components

  const { targetUser, checkId, userIsChecked, userIsMatched } = rowProps;
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const currentUser = useCurrentUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
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
  });

  if (!currentUser) return <></>;
  const preTopicRecommendations: {comment: {_id: string, contents: {html: string, plaintextMainText: string}}, recommendationReason: string, yourVote: string, theirVote: string}[] | undefined = topicData?.GetTwoUserTopicRecommendations; 
  const topicRecommendations = preTopicRecommendations?.filter(topic => topic.theirVote !== null);

  const numRecommendations = topicRecommendations?.length || 0;
  const numShown = isExpanded ? numRecommendations : 1
  const numHidden = Math.max(0, numRecommendations - numShown);

  return (
    <div>
      <div key={targetUser._id} className={classes.dialogueUserRow}>
        <div className={classes.dialogueLeftContainer}>
          <div className={classes.dialogueMatchCheckbox}>
            <DialogueCheckBox
              targetUserId={targetUser._id}
              targetUserDisplayName={targetUser.displayName}
              checkId={checkId}
              isChecked={userIsChecked}
              isMatched={userIsMatched}
            />
          </div>
          <PostsItem2MetaInfo className={classes.dialogueMatchUsername}>
            <UsersName
              documentId={targetUser._id}
              simple={false}
            />
          </PostsItem2MetaInfo>
        </div>
        {showSuggestedTopics && <div className={classes.topicRecommendationsList}>
          {topicRecommendations?.slice(0,numShown).map((topic, index) => (
            <div key={index} className={classes.suggestionRow}>
              <p key={index} className={ isExpanded ? classes.debateTopicExpanded : classes.debateTopicCollapsed}>
                {topic.theirVote === 'agree' ? 
                  [<ReactionIcon key={index} size={13} react={"agree"} />, <span key={index} className={classes.agreeText}>agrees that </span>, `"${topic.comment.contents.plaintextMainText}"`] : 
                  [<ReactionIcon key={index} size={13} react={"disagree"} />, <span key={index} className={classes.disagreeText}>disagrees that </span>, `"${topic.comment.contents.plaintextMainText}"`]
                }
              </p>
            </div>
          ))}
          
      </div>}
      <div className={classes.dialogueRightContainer}>
        {<span className={isExpanded ? classes.expandIcon : classes.hideIcon} onClick={toggleExpansion}>
          {isExpanded ? '▲ hide' : (numHidden > 0 ? `▶ ...more` : '')} 
        </span>}
      </div>
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