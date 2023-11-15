import React, { useEffect, useRef, useState } from 'react';
import { Components, getFragmentText, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from '../common/withUser';
import { randomId } from '../../lib/random';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCreate } from '../../lib/crud/withCreate';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from "../../lib/crud/withMulti";
import ReactConfetti from 'react-confetti';
import { Link, NavigateFunction, useNavigate } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import {postGetEditUrl, postGetPageUrl} from '../../lib/collections/posts/helpers';
import { isProduction } from '../../lib/executionEnvironment';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {SYNC_PREFERENCE_VALUES, SyncPreference } from '../../lib/collections/dialogueMatchPreferences/schema';
import { useDialog } from '../common/withDialog';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';
import mergeWith from 'lodash/mergeWith';
import partition from 'lodash/partition';
import { head } from 'underscore';

export type UpvotedUser = {
  _id: string;
  username: string;
  displayName: string;
  total_power: number;
  power_values: string;
  vote_counts: number;
  total_agreement: number;
  agreement_values: string;
  recently_active_matchmaking: boolean;
};

export type CommentCountTag = {
  name: string;
  comment_count: number;
};

export type TopCommentedTagUser = {
  _id: string;
  username: string;
  displayName: string;
  total_power: number;
  tag_comment_counts: Array<{
    name: string;
    post_comment_count: number;
  }>
};

export type UserDialogueUsefulData = {
  dialogueUsers: UsersOptedInToDialogueFacilitation[],
  topUsers: UpvotedUser[],
}

export type TagWithCommentCount = {
  tag: DbTag,
  commentCount: number
}

export type TopicRecommendationData = DbComment[]

interface CommonDialogueUserRowProps {
  checkId: string;
  userIsChecked: boolean;
  userIsMatched: boolean;
  currentUser: UsersCurrent;
  showBio: boolean | undefined;
  showFrequentCommentedTopics: boolean | undefined;
  showPostsYouveRead: boolean | undefined;
}

type DialogueUserRowProps<V extends boolean> = V extends true ? (CommonDialogueUserRowProps & {
  targetUser: UpvotedUser;
  showKarma: boolean;
  showAgreement: boolean;
}) : (CommonDialogueUserRowProps & {
  targetUser: Omit<UsersOptedInToDialogueFacilitation, 'karma'>;
  showKarma: false;
  showAgreement: false;
});


type RowUser = UsersOptedInToDialogueFacilitation & {
  [k in keyof Omit<UpvotedUser, '_id' | 'username' | 'displayName'>]?: never;
};

type CommonUserTableProps = {
  classes: ClassesType<typeof styles>;
  gridClassName: string,
  currentUser: UsersCurrent;
  userDialogueChecks: DialogueCheckInfo[];
  showBio: boolean;
  showPostsYouveRead: boolean;
  showFrequentCommentedTopics: boolean;
}

type UserTableProps<V extends boolean> = V extends false ? (CommonUserTableProps & {
  users: RowUser[];
  showKarma: false;
  showAgreement: false;
  isUpvotedUser: false;
  showHeaders: boolean;
}) : (CommonUserTableProps & {
  users: UpvotedUser[];
  showKarma: boolean;
  showAgreement: boolean;
  isUpvotedUser: true;
  showHeaders: boolean;
});

type NextStepsDialogProps = {
  onClose: () => void;
  userId: string;
  targetUserId: string;
  targetUserDisplayName: string;
  dialogueCheckId: string;
  dialogueCheck: DialogueCheckInfo;
  classes: ClassesType<typeof styles>;
};

type DialogueNextStepsButtonProps = {
  isMatched: boolean;
  checkId: string,
  targetUserId: string;
  targetUserDisplayName: string;
  currentUser: UsersCurrent;
  classes: ClassesType<typeof styles>;
};

const minRowHeight = 28;
const minMobileRowHeight = 60;

const xsGridBaseStyles = (theme: ThemeType) => ({
  display: 'grid',
  //                    checkbox                    name                        message                match
  gridTemplateColumns: `minmax(min-content, auto)   minmax(min-content, 2fr)   minmax(80px, 1fr)     minmax(min-content, 1fr)`,
  gridAutoRows: `${minMobileRowHeight}px`,
  gridRowGap: 5,
  columnGap: 10,
  alignItems: 'center',
  "& .MuiFormControlLabel-root": {
    marginLeft: 0,
  },
  "& svg.MuiSvgIcon-root": {
    width: "100%",
    height: 30,
  },
  background:
    `repeating-linear-gradient(${theme.palette.background.default } 0 60px,transparent 60px 120px)`
})

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20,
    ...commentBodyStyles(theme),
    background: theme.palette.background.default,
    [theme.breakpoints.up('md')]: {
      marginTop: -50
    },
  },
  
  matchContainer: {
    maxWidth: 1300,
    padding: 20,
    background: theme.palette.panelBackground.default,
    borderRadius: 5,
    width: '100%'
  },
  hideAtSm: {
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  hideAtXs: {
    [theme.breakpoints.down("xs")]: {
      display: "none !important"
    }
  },
  matchContainerGridV1: {
    display: 'grid',    //      checkbox       name                       message                      match                 upvotes        agreement         tags       posts read
    gridTemplateColumns: `       60px          100px         minmax(min-content, 80px)      minmax(min-content, 80px)         100px           100px            200px     minmax(100px, 425px)`,
    gridAutoRows: `minmax(${minRowHeight}px, auto)`,
    gridRowGap: 15,
    columnGap: 10,
    alignItems: 'center',
    [theme.breakpoints.down("sm")]: {
      //                    checkbox       name         message                        match                             upvotes         agreement
      gridTemplateColumns: `60px          100px         minmax(min-content, 80px)      minmax(min-content, 80px)         100px           100px`,
    },
    [theme.breakpoints.down("xs")]: xsGridBaseStyles(theme),
  },
  matchContainerGridV2: {
    display: 'grid',    //        checkbox           name         message                match                    bio    tags    posts read
    gridTemplateColumns: `minmax(min-content, 60px) 100px minmax(min-content, 80px) minmax(min-content, 80px)     200px   200px  minmax(100px,425px) `,
    gridAutoRows: `minmax(${minRowHeight}px, auto)`,
    gridRowGap: 15,
    columnGap: 10,
    alignItems: 'center',
    [theme.breakpoints.down("sm")]: {
      //                    checkbox       name         message                        match                         posts read
      gridTemplateColumns: `60px          100px         minmax(min-content, 80px)      minmax(min-content, 80px)     minmax(100px,425px) `,
    },
    [theme.breakpoints.down("xs")]: {
      ...xsGridBaseStyles(theme)
    },
  },
  header: {
    height: 'auto',
    margin: 0,
    marginBottom: 10,
    whiteSpace: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    height: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  dialogBox: {
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  schedulingPreferences: {
    display: 'flex',
    alignItems: 'center',
  },
  schedulingQuestion: {

  },
  messageButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.darken15,
    color: theme.palette.link.unmarked,
    whiteSpace: 'nowrap',
    borderRadius: 5,
    [theme.breakpoints.down("xs")]: {
      "fontSize": "1.25rem",
      "padding": "0.2rem",
    },
  },
  enterTopicsButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.light,
    color: 'white',
    whiteSpace: 'nowrap',
    borderRadius: 5,
    [theme.breakpoints.down("xs")]: {
      "fontSize": "1.25rem",
      "padding": "0.2rem",
    },
  },
  lightGreenButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.main ,
    color: 'white',
    whiteSpace: 'nowrap',
    borderRadius: 5
  },
  waitingMessage: {
    maxWidth: 200,
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: 'white',
    color: 'black',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  link: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.light,
    }
  },
  rootFlex: {
    display: 'flex',
    alignItems: 'stretch'
  },
  gradientBigTextContainer: {
    position: 'relative',
    maxHeight: 70, 
    overflow: 'auto',
    color: 'grey', 
    fontSize: 14,
    lineHeight: '1.15em',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
    '&.scrolled-to-bottom': {
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
    },
    '&.scrolled-to-top': {
      WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
    }
  },
  privacyNote: {
    color: 'grey',
    fontSize: '1rem',
    maxWidth: 1300
  },
  checkbox: {
    height: 10, 
    color: 'default',
    '&$checked': {
      color: 'default',
    },
  },
  checked: {
    height: 10, 
  },
  checkboxCheckedMatched: {
    height: 10, 
    color: theme.palette.lwTertiary.main,
    '&$checked': {
      color: theme.palette.lwTertiary.main,
    },
  },
  checkboxCheckedNotMatched: {
    height: 10, 
    color: '#ADD8E6',
    '&$checked': {
      color: '#00000038',
    },
  },
  centeredText: {
    display: 'flex',
    maxHeight: minRowHeight, 
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    maxWidth: 1100,
  },

  // mobile warning stuff
  mobileWarning: {
    backgroundColor: 'yellow',
    padding: 10,
    marginBottom: 20,
    maxWidth: '40vw',
    [theme.breakpoints.up("xs")]: {
      display: "none"
    }
  },
  // opt-in stuff
  optInContainer: {
    display: 'flex',
    alignItems: 'top',
  },
  optInLabel: {
    paddingLeft: 8,
  },
  optInCheckbox: {
    height: 10,
    width: 30,
    color: "#9a9a9a",
  },
  dialogueTopicList: {
    marginTop: 16,
    marginBottom: 16
  },
  dialogueTopicRow: {
    display: 'flex',
    alignItems: 'center',
    alignContent: 'space-between',
    marginBottom: 8,
    marginTop: 8
  },
  dialogueTopicRowTopicText: {
    fontSize:'1.1rem',
    opacity: '0.8',
    lineHeight: '1.32rem'
  },
  dialogueTopicRowTopicCheckbox: {
    padding: '4px 16px 4px 8px'
  },
  dialogueTopicSubmit: {
    display: 'flex'
  },
  dialogueTitle: {
    paddingBottom: 8
  },
  dialogueFormatGrid: {
    display: 'grid',
    grid: 'auto-flow / 1fr 40px 40px 40px',
    alignItems: 'center',
    marginBottom: 8
  },
  dialogueFormatHeader: {
    marginBottom: 8
  },
  dialogueFormatLabel: {
    textAlign: 'center',
    opacity: 0.5
  },
  dialogSchedulingCheckbox: {
    paddingTop: 4,
    paddingBottom: 4
  },
});

const redirect = (redirectId: string | undefined, navigate: NavigateFunction) => {
  if (redirectId) {
    navigate(postGetEditUrl(redirectId))
  }
}

async function pingSlackWebhook(webhookURL: string, data: any) {
  // ping the slack webhook to inform team of match. YOLO:ing and putting this on the client. Seems fine: but it's the second time this happens, and if we're doing it a third time, I'll properly move it all to the server 
  try {
    const response = await fetch(webhookURL, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response
  } catch (error) {
    //eslint-disable-next-line no-console
    console.error('There was a problem with the fetch operation: ', error);
  }
}

const useScrollGradient = (ref: React.RefObject<HTMLDivElement>) => {
  const [isScrolledToTop, setIsScrolledToTop] = useState(true);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  useEffect(() => {
    const element = ref.current;
    const handleScroll = () => {
      if (element) {
        const atTop = element.scrollTop <= (element.scrollHeight * 0.10);
        const atBottom = (element.scrollHeight - element.scrollTop) <= (element.clientHeight * 1.10);
        setIsScrolledToTop(atTop);
        setIsScrolledToBottom(atBottom);
      }
    };

    element?.addEventListener('scroll', handleScroll);
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return { isScrolledToTop, isScrolledToBottom };
};

const isMatched = (userDialogueChecks: DialogueCheckInfo[], targetUserId: string): boolean => {
  return userDialogueChecks.some(check => check.targetUserId === targetUserId && check.match);
};

const isChecked = (userDialogueChecks: DialogueCheckInfo[], targetUserId: string): boolean => {
  return userDialogueChecks?.find(check => check.targetUserId === targetUserId)?.checked ?? false;
};

const getUserCheckInfo = (targetUser: RowUser | UpvotedUser, userDialogueChecks: DialogueCheckInfo[]) => {
  const checkId = userDialogueChecks?.find(check => check.targetUserId === targetUser._id)?._id;
  const userIsChecked = isChecked(userDialogueChecks, targetUser._id);
  const userIsMatched = isMatched(userDialogueChecks, targetUser._id);
  return {
    checkId,
    userIsChecked,
    userIsMatched
  };
}

export const getRowProps = (tableProps: Omit<UserTableProps<boolean>, 'classes' | 'gridClassName' | 'showHeaders'>): DialogueUserRowProps<boolean>[] => {
  return tableProps.users.map(targetUser => {
    const checkInfo = getUserCheckInfo(targetUser, tableProps.userDialogueChecks);
    const { users, userDialogueChecks, ...remainingRowProps } = tableProps;
  
    const rowProps = {
      targetUser,
      ...checkInfo,
      ...remainingRowProps,
    };

    return rowProps;
  }) as DialogueUserRowProps<boolean>[];
};

const headerTexts = {
  name: "Name",
  message: "Message",
  match: "Match",
  karma: "Karma",
  agreement: "Agreement",
  bio: "Bio",
  tags: "Frequent commented topics",
  postsRead: "Posts you've read"
}

const UserBio = ({ classes, userId }: { classes: ClassesType<typeof styles>, userId: string }) => {
  const { document: userData, loading } = useSingle({
    documentId: userId,
    collectionName: "Users",
    fragmentName: "UsersProfile"
  });

  const bioContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(bioContainerRef);

  return (
    <div 
      className={classNames(classes.gradientBigTextContainer, {
        'scrolled-to-top': isScrolledToTop,
        'scrolled-to-bottom': isScrolledToBottom
      }, classes.hideAtSm)} 
      ref={bioContainerRef}
    >
      {userData?.biography?.plaintextDescription }
    </div>
  )
};

const UserPostsYouveRead = ({ classes, targetUserId, hideAtSm, limit = 20}: { classes: ClassesType<typeof styles>, targetUserId: string, hideAtSm: boolean, limit?: number }) => {
  const currentUser = useCurrentUser();
  const { Loading, PostsTooltip, LWDialog } = Components;


  const { loading, error, data } = useQuery(gql`
    query UsersReadPostsOfTargetUser($userId: String!, $targetUserId: String!, $limit: Int) {
      UsersReadPostsOfTargetUser(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        title
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUserId, limit : limit },
  });

  const readPosts:DbPost[] = data?.UsersReadPostsOfTargetUser

  const readPostsContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(readPostsContainerRef);

  if (loading) return < Loading/>
  if (error) return <p>Error: {error.message} </p>;

  return (
    <div 
      className={classNames(classes.gradientBigTextContainer, hideAtSm ? classes.hideAtSm : classes.hideAtXs, {
        'scrolled-to-top': isScrolledToTop,
        'scrolled-to-bottom': isScrolledToBottom
      })} 
      ref={readPostsContainerRef}
    >
      {readPosts.length > 0 ? (
        readPosts.map((post, index) => (
          <PostsTooltip key={index} postId={post._id}>
            <Link key={index} to={postGetPageUrl(post)}>• {post.title} </Link>
            <br/>
          </PostsTooltip>
        ))
      ) : (
        <p>(no posts read...)</p>
      )}
    </div>
  );
};

const UserTopTags = ({ classes, targetUserId }: { classes: ClassesType<typeof styles>, targetUserId: string }) => {
  const { Loading } = Components;

  const { loading, error, data } = useQuery(gql`
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
    variables: { userId: targetUserId },
  });

  const topTags:[TagWithCommentCount] = data?.UserTopTags;

  const tagContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(tagContainerRef);

  if (loading) return <Loading/>
  if (error) return <p>Error: {error.message} </p>;

  return (
    <div 
      className={classNames(
        classes.gradientBigTextContainer,
        classes.hideAtSm,
        { 'scrolled-to-top': isScrolledToTop,
          'scrolled-to-bottom': isScrolledToBottom
        })}> 
      {topTags.length > 0 ? (
        topTags.map((tag, index) => (
          <div key={index}>
            • {tag.tag.name}
            <br/>
          </div>
        ))
      ) : (
        <p>(no comments...)</p>
      )}
    </div>
  );
};

const Headers = ({ titles, classes }: { titles: string[], classes: ClassesType<typeof styles> }) => {
  return (
    <>
      {titles.map((title, index) => {
        const hideClass = [headerTexts.bio, headerTexts.tags].includes(title)
          ? classes.hideAtSm
          : [headerTexts.karma, headerTexts.agreement].includes(title)
          ? classes.hideAtXs
          : title === headerTexts.postsRead
          ? titles.includes(headerTexts.karma)
            ? classes.hideAtSm
            : classes.hideAtXs
          : ''
        return <h5 key={index} className={classNames(classes.header, hideClass)}> {title} </h5>
      })}
    </>
  );
};

type ExtendedDialogueMatchPreferenceTopic = DbDialogueMatchPreference["topicPreferences"][number] & {matchedPersonPreference?: "Yes" | "Meh" | "No"}

const NextStepsDialog = ({ onClose, userId, targetUserId, targetUserDisplayName, dialogueCheckId, classes, dialogueCheck }: NextStepsDialogProps) => {
  const { LWDialog } = Components;

  const [topicNotes, setTopicNotes] = useState(dialogueCheck.matchPreference?.topicNotes ?? "");
  const [formatSync, setFormatSync] = useState<SyncPreference>(dialogueCheck.matchPreference?.syncPreference ?? "Meh");
  const [formatAsync, setFormatAsync] = useState<SyncPreference>(dialogueCheck.matchPreference?.asyncPreference ?? "Meh");
  const [formatNotes, setFormatNotes] = useState(dialogueCheck.matchPreference?.formatNotes ?? "");

  const { create, called, loading: loadingCreatedMatchPreference, data: newMatchPreference } = useCreate({
    collectionName: "DialogueMatchPreferences",
    fragmentName: "DialogueMatchPreferencesDefaultFragment",
  })

  const navigate = useNavigate();

  const onSubmit = async () => {
    const response = await create({
      data: {
        dialogueCheckId: dialogueCheckId,
        topicPreferences: topicPreferences.map(topic => ({...topic, matchedPersonPreference: undefined, preference: topic.preference ?? "No"})),
        topicNotes: topicNotes,
        syncPreference: formatSync,
        asyncPreference: formatAsync,
        formatNotes: formatNotes,
      }
    })

    const redirectId = response.data?.createDialogueMatchPreference.data.generatedDialogueId
    
    if (redirectId) {
      redirect(redirectId, navigate)
      onClose()
    }
  }

  const { loading, error, data } = useQuery(gql`
    query getTopicRecommendations($userId: String!, $targetUserId: String!, $limit: Int!) {
      GetTwoUserTopicRecommendations(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        contents {
          html
          plaintextMainText
        }
      }
    }
  `, {
    variables: { userId, targetUserId, limit:4 },
  });


  const topicRecommendations: CommentsList[] = data?.GetTwoUserTopicRecommendations; // Note CommentsList is too permissive here, but making my own type seemed too hard

  
  const ownTopicDict = Object.fromEntries(dialogueCheck.matchPreference?.topicPreferences?.filter(topic => topic.preference === "Yes").map(topic => [topic.text, topic]) ?? [])
  const matchedPersonTopicDict = Object.fromEntries(dialogueCheck.matchingMatchPreference?.topicPreferences?.filter(topic => topic.preference === "Yes").map(topic => [topic.text, {...topic, preference: undefined, matchedPersonPreference: topic.preference}]) ?? [])
  const mergedTopicDict = mergeWith(ownTopicDict, matchedPersonTopicDict, (ownTopic, matchedPersonTopic) => ({...matchedPersonTopic, ...ownTopic}))
  const [topicPreferences, setTopicPreferences] = useState<ExtendedDialogueMatchPreferenceTopic[]>(Object.values(mergedTopicDict))

  useEffect(() => setTopicPreferences(topicPreferences => {
    const existingTopicDict = Object.fromEntries(topicPreferences.map(topic => [topic.text, topic]))
    const newRecommendedTopicDict = Object.fromEntries(topicRecommendations?.map(comment => [comment.contents?.plaintextMainText ?? '', {
      text: comment.contents?.plaintextMainText ?? '',
      preference: 'No' as const,
      commentSourceId: comment._id
    }]) ?? [])
    const mergedTopicDict = mergeWith(existingTopicDict, newRecommendedTopicDict, (existingTopic, newRecommendedTopic) => ({...newRecommendedTopic, ...existingTopic}))
    return Object.values(mergedTopicDict)
  }), [topicRecommendations])

  useEffect

  const [recommendedTopics, userSuggestedTopics]  = partition(topicPreferences, topic => topic.matchedPersonPreference !== "Yes")
  if (called && !loadingCreatedMatchPreference && !(newMatchPreference as any)?.createDialogueMatchPreference?.data?.generatedDialogueId) {
    return (
      <LWDialog open onClose={onClose}>
          <DialogTitle>
            <h2>You submitted, nice job.</h2>
            <p>This info will be sent to your match partner.</p> 
            <p>Once they fill out the form, you'll get to see each other's answers and chat about whether a dialogue makes sense.</p>
          </DialogTitle>
          <div style={{textAlign: "center"}}>
            <img style={{maxHeight: "50px"}} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico"></img>
          </div>
          <DialogActions>
            <Button onClick={onClose} color="default">
              Close
            </Button>
          </DialogActions>
      </LWDialog>
  )}

  return (
    <LWDialog open onClose={onClose}>
      <div className={classes.dialogBox}>
        <DialogTitle className={classes.dialogueTitle}>Alright, you matched with {targetUserDisplayName}!</DialogTitle>
        <DialogContent >
          {userSuggestedTopics.length > 0 && <>
            <div>Here are some topics {targetUserDisplayName} was interested in:</div>
            <div className={classes.dialogueTopicList}>
              {userSuggestedTopics.map((topic) => <div className={classes.dialogueTopicRow} key={topic.text}>
                <Checkbox 
                    className={classes.dialogueTopicRowTopicCheckbox}
                    color={topic.matchedPersonPreference === "Yes" ? "primary" : "default"}
                    checked={topic.preference === "Yes"}
                    // Set the preference of the topic with the matching text to the new preference
                    onChange={event => setTopicPreferences(
                      topicPreferences.map(
                        existingTopic => existingTopic.text === topic.text ? {
                          ...existingTopic, 
                          preference: existingTopic.preference === "Yes" ? "No" as const : "Yes" as const,
                        } : existingTopic
                      )
                    )}
                  />
                  <div className={classes.dialogueTopicRowTopicText}>
                    {topic.text}
                  </div>
              </div>)}
          </div></>}
            <div>Here are some popular topics on LW. Check any you're interested in discussing.</div>
            <div className={classes.dialogueTopicList}>
              {recommendedTopics.map((topic) => <div className={classes.dialogueTopicRow} key={topic.text}>
                <Checkbox 
                    className={classes.dialogueTopicRowTopicCheckbox}
                    color={topic.matchedPersonPreference === "Yes" ? "primary" : "default"}
                    checked={topic.preference === "Yes"}
                    // Set the preference of the topic with the matching text to the new preference
                    onChange={event => setTopicPreferences(
                      topicPreferences.map(
                        existingTopic => existingTopic.text === topic.text ? {
                          ...existingTopic, 
                          preference: event.target.checked ? "Yes" as const : "No" as const,
                        } : existingTopic
                      )
                    )}
                  />
                  <div className={classes.dialogueTopicRowTopicText}>
                    {topic.text} {topic.matchedPersonPreference === "Yes" && <b>Your match is interested in this topic</b>}
                  </div>
              </div>)}
            </div>
            
            <div className={classes.dialogueTopicSubmit}>
              <TextField
                variant="outlined"
                label={`Suggest other topics to ${targetUserDisplayName}?`}
                fullWidth
                value={topicNotes}
                onChange={event => setTopicNotes(event.target.value)}
              />
              <Button color="default" onClick={e => {
                setTopicPreferences([...topicPreferences, {
                  text: topicNotes,
                  preference: 'Yes' as const, 
                  commentSourceId: null
                }])
                setTopicNotes('')
              } }>
                Add Topic
              </Button>
            </div>
            <br />
            <div className={classes.dialogueFormatGrid}>
              <h3 className={classes.dialogueFormatHeader}>What Format Do You Prefer?</h3>
              <label className={classes.dialogueFormatLabel}>Great</label>
              <label className={classes.dialogueFormatLabel}>Okay</label>
              <label className={classes.dialogueFormatLabel}>No</label>
              
              <div className={classes.schedulingQuestion}>Find a synchronous 1-3hr block to sit down and dialogue</div>
              {SYNC_PREFERENCE_VALUES.map((value, idx) => <Checkbox 
                  key={value}
                  checked={formatSync === value}
                  className={classes.dialogSchedulingCheckbox}
                  onChange={event => setFormatSync(value as SyncPreference)}
              />)}

              <div className={classes.schedulingQuestion}>Have an asynchronous dialogue where you reply where convenient</div>
              {SYNC_PREFERENCE_VALUES.map((value, idx) => <Checkbox 
                  key={value}
                  checked={formatAsync === value}
                  className={classes.dialogSchedulingCheckbox}
                  onChange={event => setFormatAsync(value as SyncPreference)}
              />)}
              
            </div>      
            <TextField
              multiline
              rows={2}
              variant="outlined"
              label="Anything else to add?"
              fullWidth
              value={formatNotes}
              onChange={event => setFormatNotes(event.target.value)}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="default">
            Close
          </Button>
          <Button onClick={onSubmit} color="primary">
            {loadingCreatedMatchPreference ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </div>
    </LWDialog>
  );
};

const NextStepsDialogComponent = registerComponent("NextStepsDialog", NextStepsDialog, { styles });


const DialogueCheckBox: React.FC<{
  targetUserId : string;
  targetUserDisplayName : string;
  checkId?: string;
  isChecked: boolean, 
  isMatched: boolean;
  classes: ClassesType<typeof styles>;
}> = ({ targetUserId, targetUserDisplayName, checkId, isChecked, isMatched, classes}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { openDialog } = useDialog();

  const [upsertDialogueCheck] = useMutation(gql`
    mutation upsertUserDialogueCheck($targetUserId: String!, $checked: Boolean!) {
      upsertUserDialogueCheck(targetUserId: $targetUserId, checked: $checked) {
          ...DialogueCheckInfo
        }
      }
    ${getFragmentText('DialogueCheckInfo')}
    ${getFragmentText('DialogueMatchPreferencesDefaultFragment')}
    `)
  
  async function handleNewMatchAnonymisedAnalytics() {
    captureEvent("newDialogueReciprocityMatch", {}) // we only capture match metadata and don't pass anything else

    // ping the slack webhook to inform team of match. YOLO:ing and putting this on the client. Seems fine: but it's the second time this happens, and if we're doing it a third time, I'll properly move it all to the server 
    const webhookURL = isProduction ? "https://hooks.slack.com/triggers/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" : "https://hooks.slack.com/triggers/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"  //
    const data = {} // Not sending any data for now 
    void pingSlackWebhook(webhookURL, data)
    
  }

  const [showConfetti, setShowConfetti] = useState(false);


  async function updateDatabase(event: React.ChangeEvent<HTMLInputElement>, targetUserId: string, checkId?: string) {
    if (!currentUser) return;

    const response = await upsertDialogueCheck({
      variables: {
        targetUserId: targetUserId, 
        checked: event.target.checked
      },
      update(cache, { data }) {
        if (!checkId) {
          cache.modify({
            fields: {
              dialogueChecks(existingChecksRef) {
                const newCheckRef = cache.writeFragment({
                  data: data.upsertUserDialogueCheck,
                  fragment: gql`
                    ${getFragmentText('DialogueCheckInfo')}
                    ${getFragmentText('DialogueMatchPreferencesDefaultFragment')}
                  `,
                  fragmentName: 'DialogueCheckInfo'
                });
                return {
                  ...existingChecksRef,
                  results: [...existingChecksRef.results, newCheckRef]
                }
              }
            }
          });
        }
      },
      optimisticResponse: {
        upsertUserDialogueCheck: {
          _id: checkId ?? randomId(),
          __typename: 'DialogueCheck',
          userId: currentUser._id,
          targetUserId: targetUserId,
          checked: event.target.checked,
          checkedAt: new Date(),
          match: false,
          matchPreference: null,
          matchingMatchPreference: null
        }
      }
    })
    
    if (response.data.upsertUserDialogueCheck.match) {
      void handleNewMatchAnonymisedAnalytics()
      setShowConfetti(true);
      openDialog({
        componentName: 'NextStepsDialog',
        componentProps: {
          userId: currentUser?._id,
          targetUserId,
          targetUserDisplayName,
          dialogueCheckId: response.data.upsertUserDialogueCheck._id,
          dialogueCheck: response.data.upsertUserDialogueCheck
        }
      });
    }
  }

  return (
    <>
      {showConfetti && <ReactConfetti recycle={false} colors={["#7faf83", "#00000038" ]} onConfettiComplete={() => setShowConfetti(false)} />}
      <FormControlLabel
        control={ 
          <Checkbox 
            classes={{
              root: classNames({
                [classes.checkbox]: !isChecked,
                [classes.checkboxCheckedMatched]: isChecked && isMatched,
                [classes.checkboxCheckedNotMatched]: isChecked && !isMatched
              }),
              checked: classes.checked
            }}
            onChange={event => updateDatabase(event, targetUserId, checkId) } 
            checked={isChecked}
          />
        }
        label=""
      />
    </>
  );
};

const DialogueNextStepsButton: React.FC<DialogueNextStepsButtonProps> = ({
  isMatched,
  checkId,
  targetUserId,
  targetUserDisplayName,
  currentUser,
  classes,
}) => {

  const { openDialog } = useDialog();

  const navigate = useNavigate();

  const {loading: userLoading, results} = useMulti({
    terms: {
      view: "dialogueMatchPreferences",
      dialogueCheckId: checkId,
      limit: 1000,
    },
    fragmentName: "DialogueMatchPreferenceInfo",
    collectionName: "DialogueMatchPreferences",
  });

  const { document: dialogueCheck } = useSingle({
    fragmentName: "DialogueCheckInfo",
    collectionName: "DialogueChecks",
    documentId: checkId,
  });

  if (!isMatched) return <div></div>; // need this instead of null to keep the table columns aligned

  const userMatchPreferences = results?.[0]
  const generatedDialogueId = userMatchPreferences?.generatedDialogueId;

  if (!!generatedDialogueId) {
    return (
      <button className={classes.lightGreenButton} onClick={(e) => redirect(generatedDialogueId, navigate)}>
        <a data-cy="message">Go to dialogue</a>
      </button>
    );
  }

  if (userMatchPreferences) {
    return (
      <div className={classes.waitingMessage}>
        Waiting for {targetUserDisplayName}...
      </div>
    );
  }

  return (
    <button
      className={classes.enterTopicsButton}
      onClick={(e) => {
        dialogueCheck && openDialog({
          componentName: 'NextStepsDialog',
          componentProps: {
            userId: currentUser?._id,
            targetUserId,
            targetUserDisplayName,
            dialogueCheckId: checkId,
            dialogueCheck
          }
        })
      }}
    >
      <a data-cy="message">Enter topics</a>
    </button>
  );
};

const MessageButton: React.FC<{
  targetUserId: string;
  currentUser: UsersCurrent; 
  classes: ClassesType<typeof styles>;
}> = ({ targetUserId, currentUser, classes }) => {
  const { NewConversationButton } = Components;
  
  return (
    <button className={classes.messageButton}>
      <NewConversationButton user={{_id: targetUserId}} currentUser={currentUser}>
        <a data-cy="message">Message</a>
      </NewConversationButton>
    </button>
  );
};


const DialogueUserRow = <V extends boolean>(props: DialogueUserRowProps<V> & { classes: ClassesType }): JSX.Element => {
  const { targetUser, checkId, userIsChecked, userIsMatched, classes, currentUser, showKarma, showAgreement, showBio, showFrequentCommentedTopics, showPostsYouveRead } = props;
  const { UsersName, DialogueCheckBox, MessageButton, DialogueNextStepsButton } = Components;

  return <React.Fragment key={`${targetUser._id}_other`}>
    <DialogueCheckBox
      targetUserId={targetUser._id}
      targetUserDisplayName={targetUser.displayName}
      checkId={checkId}
      isChecked={userIsChecked}
      isMatched={userIsMatched}
    />
    <UsersName
      className={classes.displayName}
      documentId={targetUser._id}
      simple={false} />
    <MessageButton
      targetUserId={targetUser._id}
      currentUser={currentUser}
    />
    <DialogueNextStepsButton
      isMatched={userIsMatched}
      checkId={checkId}
      targetUserId={targetUser._id}
      targetUserDisplayName={targetUser.displayName}
      currentUser={currentUser}
    />
    {showKarma && <div className={classNames(classes.hideAtXs, classes.centeredText)}> {targetUser.total_power} </div>}
    {showAgreement && <div className={classNames(classes.hideAtXs, classes.centeredText)}> {targetUser.total_agreement} </div>}
    {showBio && <UserBio
      key={targetUser._id}
      classes={classes}
      userId={targetUser._id} />}
    {showFrequentCommentedTopics && <UserTopTags
      classes={classes}
      targetUserId={targetUser._id} />}
    {showPostsYouveRead && <UserPostsYouveRead
      classes={classes}
      targetUserId={targetUser._id}
      limit={8}
      hideAtSm={showKarma} />}
  </React.Fragment>;
}

const UserTable = <V extends boolean>(props: UserTableProps<V>) => {
  const {
    users,
    classes,
    gridClassName,
    userDialogueChecks,
    showHeaders,
    ...rest
  } = props;

  const { DialogueUserRow } = Components;

  const headers = [
    "Dialogue maybe?",
    " ",
    " ",
    " ",
    ...(rest.showKarma ? [headerTexts.karma] : []),
    ...(rest.showAgreement ? [headerTexts.agreement] : []),
    ...(rest.showBio ? [headerTexts.bio] : []),
    ...(rest.showFrequentCommentedTopics ? [headerTexts.tags] : []),
    ...(rest.showPostsYouveRead ? [headerTexts.postsRead] : []),
  ];

  const allRowProps = getRowProps(props);
  const rows = allRowProps.map((rowProps) => <DialogueUserRow key={rowProps.targetUser._id} {...rowProps} />);

  return (
    <div className={gridClassName}>
      {showHeaders && <Headers titles={headers} classes={classes} />}
      {rows}
    </div>
  );
};

export const DialogueMatchingPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const updateCurrentUser = useUpdateCurrentUser()
  const currentUser = useCurrentUser();
  const [optIn, setOptIn] = React.useState(currentUser?.revealChecksToAdmins); // for rendering the checkbox

  const { Loading, LoadMore, IntercomWrapper } = Components;

  const {
    matchedUsersQueryResult: { data: matchedUsersResult },
    userDialogueChecksResult: { results: userDialogueChecks },
    usersOptedInResult: { results: usersOptedInToDialogueFacilitation, loadMoreProps: optedInUsersLoadMoreProps }
  } = useDialogueMatchmaking({ getMatchedUsers: true, getOptedInUsers: true, getUserDialogueChecks: true });

  const { loading, error, data } = useQuery(gql`
    query getDialogueUsers {
      GetUserDialogueUsefulData {
        dialogueUsers {
          _id
          displayName
        }
        topUsers {
          _id
          displayName
          total_power
          total_agreement
          recently_active_matchmaking
        }
       }
    }
  `);

  if (!currentUser) return <p>You have to be logged in to view this page</p>

  if (loading) {
    return <Loading />;
  } else if (!usersOptedInToDialogueFacilitation) {
    return <p>Error...</p>;
  }

  const userDialogueUsefulData: UserDialogueUsefulData = data?.GetUserDialogueUsefulData;

  const matchedUsers: UsersOptedInToDialogueFacilitation[] | undefined = matchedUsersResult?.GetDialogueMatchedUsers;
  const matchedUserIds = matchedUsers?.map(user => user._id) ?? [];
  const topUsers = userDialogueUsefulData?.topUsers.filter(user => !matchedUserIds.includes(user._id));
  const recentlyActiveTopUsers = topUsers.filter(user => user.recently_active_matchmaking)
  const inRecentlyActiveTopUsers = topUsers.filter(user => !user.recently_active_matchmaking)
  const dialogueUsers = userDialogueUsefulData?.dialogueUsers.filter(user => !matchedUserIds.includes(user._id));
  const optedInUsers = usersOptedInToDialogueFacilitation.filter(user => !matchedUserIds.includes(user._id));
  
  if (loading) return <Loading />
  if (error ?? !userDialogueChecks ?? userDialogueChecks.length > 1000) return <p>Error </p>; // if the user has clicked that much stuff things might break...... 
  if (userDialogueChecks?.length > 1000) {
    throw new Error(`Warning: userDialogueChecks.length > 1000, seems user has checked more than a thousand boxes? how is that even possible? let a dev know and we'll fix it...`);
  }

  const handleOptInToRevealDialogueChecks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptIn(event.target.checked);
    void updateCurrentUser({revealChecksToAdmins: event.target.checked})
    captureEvent("optInToRevealDialogueChecks", {optIn: event.target.checked})
    
    if (event.target.checked) {
       // ping the slack webhook to inform team of opt-in. YOLO:ing and putting this on the client. Seems fine. 
      const webhookURL = "https://hooks.slack.com/triggers/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" 
      const userDetailString = currentUser?.displayName + " / " + currentUser?.slug
      const data = { user: userDetailString };
      void pingSlackWebhook(webhookURL, data)
    }
  };

  const prompt = "Opt-in to LessWrong team viewing your checks, to help proactively suggest and facilitate dialogues" 

  return (
  <div className={classes.root}>
    <div className={classes.container}>
      <div className={classes.mobileWarning}>
        Dialogues matching doesn't render well on narrow screens right now. <br/> <br /> Please view on laptop or tablet!
      </div>

      <h1>Dialogue Matching</h1>
      <ul>
        <li>Check a user you'd maybe be interested in having a dialogue with, if they were too</li>
        <li>They can't see your checks unless you match</li>
        <li>If you match, you'll both get a tiny form to enter topic ideas</li>
        <li>You can then see each other's answers, and choose whether start a dialogue</li>
      </ul>
      
      <div className={classes.optInContainer}>
        <FormControlLabel className={classes.optInLabel}
          control={
            <Checkbox
              checked={optIn}
              onChange={event => handleOptInToRevealDialogueChecks(event)}
              name="optIn"
              color="primary"
              className={classes.optInCheckbox}
            />
          }
          label={<span> {prompt} </span>}
        />
    </div> 
    </div> 
    <p className={classes.privacyNote}>On privacy: LessWrong team does not look at user’s checks unless you opted in. We do track metadata, like “Two users just matched”, 
      to help us know whether the feature is getting used. If one user opts in to revealing their checks we can still not see their matches, unless 
      the other part of the match has also opted in.
    </p>
    { !(matchedUsers?.length) ?  null : <>
      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>Matches</h3>
          <UserTable
            users={matchedUsers ?? []}
            isUpvotedUser={false}
            classes={classes}
            gridClassName={classes.matchContainerGridV2}
            currentUser={currentUser}
            userDialogueChecks={userDialogueChecks}
            showBio={true}
            showKarma={false}
            showAgreement={false}
            showPostsYouveRead={true}
            showFrequentCommentedTopics={true}
            showHeaders={true}
          />
        </div>
      </div>
      <br />
      <br />
    </> }
    { !topUsers.length ? null : <>
      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>Your Top Voted Users (Last 18 Months)</h3>
          { recentlyActiveTopUsers.length == 0 ? null : <>
          <h4>Recently active on dialogue matching (last 10 days)</h4>
          <UserTable
            users={recentlyActiveTopUsers}
            isUpvotedUser={true}
            classes={classes}
            gridClassName={classes.matchContainerGridV1}
            currentUser={currentUser}
            userDialogueChecks={userDialogueChecks}
            showBio={false}
            showKarma={true}
            showAgreement={true}
            showPostsYouveRead={true}
            showFrequentCommentedTopics={true}
            showHeaders={true}
          />
        <br />
        </> }
      { inRecentlyActiveTopUsers.length == 0 ? null : <>
            <h4>Not recently active on dialogue matching</h4>
            <UserTable
              users={inRecentlyActiveTopUsers}
              isUpvotedUser={true}
              classes={classes}
              gridClassName={classes.matchContainerGridV1}
              currentUser={currentUser}
              userDialogueChecks={userDialogueChecks}
              showBio={false}
              showKarma={true}
              showAgreement={true}
              showPostsYouveRead={true}
              showFrequentCommentedTopics={true}
              showHeaders={!recentlyActiveTopUsers.length}
            />
          </>}
          </div>
      </div>
      <br />
    </> }
    <div className={classes.rootFlex}>
      <div className={classes.matchContainer}>
        <h3>People who published dialogues</h3>
        <UserTable
          users={dialogueUsers}
          isUpvotedUser={false}
          classes={classes}
          gridClassName={classes.matchContainerGridV2}
          currentUser={currentUser}
          userDialogueChecks={userDialogueChecks}
          showBio={true}
          showKarma={false}
          showAgreement={false}
          showPostsYouveRead={true}
          showFrequentCommentedTopics={true}
          showHeaders={true}
        />
      </div>
    </div>
    <br />
    <div className={classes.rootFlex}>
      <div className={classes.matchContainer}>
        <h3>People who checked a box saying they're interested in having dialogues</h3>
        <UserTable
          users={optedInUsers}
          isUpvotedUser={false}
          classes={classes}
          gridClassName={classes.matchContainerGridV2}
          currentUser={currentUser}
          userDialogueChecks={userDialogueChecks}
          showBio={true}
          showKarma={false}
          showAgreement={false}
          showPostsYouveRead={true}
          showFrequentCommentedTopics={true}
          showHeaders={true}
        />
        <LoadMore {...optedInUsersLoadMoreProps} loadMore={() => optedInUsersLoadMoreProps.loadMore(50)} />
      </div>
    </div>
    <IntercomWrapper />
  </div>)
}

const DialogueNextStepsButtonComponent = registerComponent('DialogueNextStepsButton', DialogueNextStepsButton, {styles});
const MessageButtonComponent = registerComponent('MessageButton', MessageButton, {styles});
const DialogueCheckBoxComponent = registerComponent('DialogueCheckBox', DialogueCheckBox, {styles});
const DialogueUserRowComponent = registerComponent('DialogueUserRow', DialogueUserRow, {styles});
const DialogueMatchingPageComponent = registerComponent('DialogueMatchingPage', DialogueMatchingPage, {styles});

declare global {
  interface ComponentTypes {
    NextStepsDialog: typeof NextStepsDialogComponent
    DialogueNextStepsButton: typeof DialogueNextStepsButtonComponent
    MessageButton: typeof MessageButtonComponent
    DialogueCheckBox: typeof DialogueCheckBoxComponent
    DialogueUserRow: typeof DialogueUserRowComponent
    DialogueMatchingPage: typeof DialogueMatchingPageComponent
  }
}
