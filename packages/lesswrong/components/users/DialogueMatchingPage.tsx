import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { gql } from "@apollo/client";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCreate } from '../../lib/crud/withCreate';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { useSingle } from '../../lib/crud/withSingle';
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
import { useUpsertDialogueCheck } from '../hooks/useUpsertDialogueCheck';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import partition from 'lodash/partition';
import {dialogueMatchmakingEnabled} from '../../lib/publicSettings';
import { useABTest } from '../../lib/abTestImpl';
import { dialogueMatchingPageNoSSRABTest, offerToAddCalendlyLink, showRecommendedContentInMatchForm } from '../../lib/abTests';
import { PostYouveRead, RecommendedComment, TagWithCommentCount } from '../dialogues/DialogueRecommendationRow';
import { validatedCalendlyUrl } from '../dialogues/CalendlyIFrame';
import { useLocation } from '../../lib/routeUtil';
import ForumNoSSR from '../common/ForumNoSSR';
import { useQueryWrapped } from '@/lib/crud/useQuery';

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
  activeDialogueMatchSeekers: UsersOptedInToDialogueFacilitation[]
}

export type TopicRecommendationData = DbComment[]

interface CommonDialogueUserRowProps {
  checkId: string;
  hideInRecommendations?: boolean;
  userIsChecked: boolean;
  userIsMatched: boolean;
  matchPreference?: DialogueMatchPreferencesDefaultFragment;
  reciprocalMatchPreference?: DialogueMatchPreferencesDefaultFragment;
  currentUser: UsersCurrent;
  showBio: boolean | undefined;
  showFrequentCommentedTopics: boolean | undefined;
  showPostsYouveRead: boolean | undefined;
}

export type DialogueUserRowProps<V extends boolean> = V extends true ? (CommonDialogueUserRowProps & {
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
  tableContext: "match" | "other";
  showHeaders: boolean;
}) : (CommonUserTableProps & {
  users: UpvotedUser[];
  showKarma: boolean;
  showAgreement: boolean;
  tableContext: "upvoted";
  showHeaders: boolean;
});

type NextStepsDialogProps = {
  onClose: () => void;
  userId: string;
  targetUserId: string;
  targetUserDisplayName: string;
  dialogueCheckId: string;
  matchPreference?: DialogueMatchPreferencesDefaultFragment;
  reciprocalMatchPreference?: DialogueMatchPreferencesDefaultFragment;
  dialogueCheck?: DialogueCheckInfo;
  classes: ClassesType<typeof styles>;
};

type DialogueNextStepsButtonProps = {
  isMatched: boolean;
  checkId: string,
  targetUserId: string;
  targetUserDisplayName: string;
  currentUser: UsersCurrent;
  matchPreference?: DialogueMatchPreferencesDefaultFragment;
  reciprocalMatchPreference?: DialogueMatchPreferencesDefaultFragment;
  dialogueCheck?: DialogueCheckInfo;
  classes: ClassesType<typeof styles>;
};

const minRowHeight = 28;
const minMobileRowHeight = 60;

const xsGridBaseStyles = (theme: ThemeType) => ({
  display: 'grid',
  //                    checkbox                    name                        message or match
  gridTemplateColumns: `minmax(min-content, auto)   minmax(min-content, 2fr)   minmax(90px, 1fr)`,
  gridAutoRows: `${minMobileRowHeight}px`,
  gridRowGap: 5,
  columnGap: 2,
  alignItems: 'center',
  "& .MuiFormControlLabel-root": {
    marginLeft: 0,
  },
  "& svg.MuiSvgIcon-root": {
    width: 30,
    height: 30,
  },
  background:
    `repeating-linear-gradient(${theme.palette.background.default } 0 60px,transparent 60px 120px)`
})

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20,
    ...commentBodyStyles(theme, true),
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
  hideAboveXs: {
    [theme.breakpoints.up("sm")]: {
      display: "none"
    }
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
    whiteSpace: 'nowrap',
    [theme.breakpoints.down("xs")]: {
      whiteSpace: 'normal',
    }
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
    lineHeight: '1.15em',
  },
  schedulingRow: {
    marginTop: 5,
    marginBottom: 5,
  },
  messageButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.darken15,
    color: theme.palette.link.unmarked,
    whiteSpace: 'nowrap',
    borderRadius: 5,
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.25rem",
      padding: "0.2rem",
      width: "75px"
    },
  },
  enterTopicsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      marginRight: 5,
    },
  },
  enterTopicsButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.grey[0],
    whiteSpace: 'nowrap',
    borderRadius: 5,
    [theme.breakpoints.down("xs")]: {
      fontSize: "1rem",
      padding: "0.3rem",
    },
  },
  enterTopicsAnnotation: {
    fontStyle: 'italic',
    color: theme.palette.text.dim3,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "0.9rem",
    lineHeight: "1rem",
    marginTop: 3,
    whiteSpace: 'nowrap',
  },
  lightGreenButton: {
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.main ,
    color: theme.palette.grey[0],
    whiteSpace: 'nowrap',
    borderRadius: 5
  },
  waitingMessage: {
    maxWidth: 200,
    maxHeight: minRowHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.grey[0],
    color: theme.palette.grey[1000],
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
    color: theme.palette.grey[600],
    fontSize: 14,
    lineHeight: '1.15em',
    WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, ${theme.palette.text.alwaysBlack} 20%, ${theme.palette.text.alwaysBlack} 80%, transparent 100%)`,
    '&.scrolled-to-bottom': {
      WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, ${theme.palette.text.alwaysBlack} 20%, ${theme.palette.text.alwaysBlack} 100%)`,
    },
    '&.scrolled-to-top': {
      WebkitMaskImage: `linear-gradient(to bottom, ${theme.palette.text.alwaysBlack} 0%, ${theme.palette.text.alwaysBlack} 80%, transparent 100%)`,
    }
  },
  privacyNote: {
    color: theme.palette.grey[600],
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
    color: theme.palette.dialogueMatching.checkedNotMatched,
    '&$checked': {
      color: theme.palette.dialogueMatching.checkedMatched,
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
    backgroundColor: theme.palette.dialogueMatching.warning,
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
    alignItems: 'flex-start',
  },
  optionControlLabel: {
    paddingLeft: 8,
  },
  optionControlCheckbox: {
    height: 10,
    width: 30,
    color: theme.palette.dialogueMatching.optIn,
    marginRight: '-10px', // to get the prompt to line up closer
  },
  dialogueTopicList: {
    marginBottom: 10
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
    lineHeight: '1.32rem',
    marginRight: 8
  },
  dialogueTopicRowTopicCheckbox: {
    padding: '4px 16px 4px 8px'
  },
  dialogueTopicSubmit: {
    display: 'flex',
    [theme.breakpoints.down("sm")]: {
      flexDirection: 'column',
    }
  },
  dialogueTitle: {
    color: theme.palette.lwTertiary.main,
    paddingBottom: 8
  },
  dialogueFormatGrid: {
    display: 'grid',
    grid: 'auto-flow / 1fr 40px 40px 40px',
    alignItems: 'center',
    marginBottom: 16,
    rowGap: '6px',
  },
  sectionHeader: {
    color: theme.palette.lwTertiary.main,
    marginBottom: 3,
    marginTop: 13
  },
  matchHeader: {
    color: theme.palette.lwTertiary.main
  },
  dialogueFormatLabel: {
    textAlign: 'center',
    opacity: 0.5
  },
  dialogSchedulingCheckbox: {
    paddingTop: 4,
    paddingBottom: 4
  },
  mobileDialog: {
    "& .MuiDialog-paper": {
      margin: 16
    }
  },
  recommendationReasons: {
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 4,
    marginLeft: 'auto',
    borderRadius: 5,
    backgroundColor: theme.palette.greyAlpha(0.05),
    whiteSpace: 'nowrap'
  },
  contentRecommendationsCard: {
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 4,
    paddingTop: 5,
    borderRadius: 5,
    backgroundColor: theme.palette.greyAlpha(0.05),
    marginTop: 5,
    marginBottom: 5,
  },
  cardTitle: {
    color: theme.palette.text.dim3,
    marginBottom: 3,
    fontSize: "0.9em"
  },
  recommendedContentContainer: {
    display: 'flex',
  },
  recommendedContentContainerExpandedMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  contentRecommendationsList: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
    fontSize: 'small',
    overflow: 'hidden',
    justifyContent: 'space-between'
  },
  recommendedContentRightContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 'auto',
  },
  topicsOrigin: {
    color: theme.palette.text.dim3,
    marginBottom: 7,
  },
  mobileBreak: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  syncText: {
    color: theme.palette.text.dim3,
  },
  checkNotificationControl: {
    marginBottom: 4
  }
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

const isHideInRecommendations = (userDialogueChecks: DialogueCheckInfo[], targetUserId: string): boolean => {
  return userDialogueChecks.find(check => check.targetUserId === targetUserId)?.hideInRecommendations ?? false;
}

const isMatched = (userDialogueChecks: DialogueCheckInfo[], targetUserId: string): boolean => {
  return userDialogueChecks.some(check => check.targetUserId === targetUserId && check.match);
};

const isChecked = (userDialogueChecks: DialogueCheckInfo[], targetUserId: string): boolean => {
  return userDialogueChecks?.find(check => check.targetUserId === targetUserId)?.checked ?? false;
};

export const getUserCheckInfo = (targetUser: RowUser | UpvotedUser, userDialogueChecks: DialogueCheckInfo[]) => {
  const check = userDialogueChecks?.find(check => check.targetUserId === targetUser._id)
  const checkId = check?._id;
  const hideInRecommendations = isHideInRecommendations(userDialogueChecks, targetUser._id);
  const userIsChecked = isChecked(userDialogueChecks, targetUser._id);
  const userIsMatched = isMatched(userDialogueChecks, targetUser._id);
  return {
    checkId,
    hideInRecommendations,
    userIsChecked,
    userIsMatched,
    matchPreference: check?.matchPreference,
    reciprocalMatchPreference: check?.reciprocalMatchPreference,
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
  dialogue: "Dialogue?",
  name: "Name",
  message: "Message",
  match: "Match",
  karma: "Karma",
  agreement: "Agreement",
  bio: "Bio",
  tags: "Frequent commented topics",
  postsRead: "Posts you've read"
}

const CheckNotificationControl = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();
  const [currentChannel, setCurrentChannel] = useState(currentUser?.notificationNewDialogueChecks.channel);
  if (currentUser === null || currentChannel == null) return null;


  const handleToggle = async () => {
    const newChannel = currentChannel === "none" ? "onsite" : "none";
    setCurrentChannel(newChannel)
    await updateCurrentUser({
      notificationNewDialogueChecks: {
        ...currentUser.notificationNewDialogueChecks,
        channel: newChannel,
      }
    })
  }

  return (
    <div className={classes.checkNotificationControl}>
      <FormControlLabel
        control={
          <Checkbox
            checked={currentChannel !== "none"}
            onChange={handleToggle}
            className={classes.optionControlCheckbox}
          />
        }
        label={null}
        className={classes.optionControlLabel}
      />{"Receive notifications when someone you've not yet checked checks you"}
    </div>
  )

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
      className={classNames(classes.gradientBigTextContainer, classes.hideAtSm, {
        'scrolled-to-top': isScrolledToTop,
        'scrolled-to-bottom': isScrolledToBottom
      })} 
      ref={bioContainerRef}
    >
      {userData?.biography?.plaintextDescription }
    </div>
  )
};

const UserPostsYouveRead = ({ classes, targetUserId, hideAtSm, limit = 20}: { classes: ClassesType<typeof styles>, targetUserId: string, hideAtSm: boolean, limit?: number }) => {
  const currentUser = useCurrentUser();
  const { Loading, PostsTooltip } = Components;


  const { loading, error, data } = useQueryWrapped(gql`
    query UsersReadPostsOfTargetUser($userId: String!, $targetUserId: String!, $limit: Int) {
      UsersReadPostsOfTargetUser(userId: $userId, targetUserId: $targetUserId, limit: $limit) {
        _id
        title
      }
    }
  `, {
    variables: { userId: currentUser?._id, targetUserId: targetUserId, limit : limit },
  });

  const readPosts: DbPost[] = data?.UsersReadPostsOfTargetUser

  const readPostsContainerRef = useRef<HTMLDivElement | null>(null);
  const { isScrolledToTop, isScrolledToBottom } = useScrollGradient(readPostsContainerRef);

  if (loading) return < Loading/>
  if (error) return <p>Error: {error.message} </p>;

  return (
    <div 
      className={classNames(classes.gradientBigTextContainer, {
        'scrolled-to-top': isScrolledToTop,
        'scrolled-to-bottom': isScrolledToBottom,
        [classes.hideAtSm]: hideAtSm,
        [classes.hideAtXs]: !hideAtSm,
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

  const { loading, error, data } = useQueryWrapped(gql`
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

  const topTags: [TagWithCommentCount] = data?.UserTopTags;

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

const Headers = ({ titles, classes, headerClasses }: { titles: string[], headerClasses: {[title: string]: string[]}, classes: ClassesType<typeof styles> }) => {
  return (
    <>
      {titles.map((title, index) => (
        <h5 key={index} className={classNames(classes.header, ...(headerClasses[title] ?? []))}> {title} </h5>
      ))}
    </>
  );
};

export type ExtendedDialogueMatchPreferenceTopic = DbDialogueMatchPreference["topicPreferences"][number] & {matchedPersonPreference?: "Yes" | "Meh" | "No", recommendationReason: string, theirVote?: string, yourVote?: string}

type UserRecommendedContentProps = {
  classes: ClassesType<typeof styles>;
  targetUserId: string;
}

const UserRecommendedContent = ({ classes, targetUserId }: UserRecommendedContentProps ) => {
  const { PostsTooltip, Loading, CommentView, TopicSuggestion, ExpandCollapseText } = Components;

  const [isExpanded, setIsExpanded] = useState(false);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()

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
  variables: { userId: targetUserId },
  skip: !currentUser
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
  variables: { userId: currentUser?._id, targetUserId: targetUserId, limit : 4 },
  skip: !currentUser
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
  variables: { userId: currentUser?._id, targetUserId: targetUserId, limit : 3 },
  skip: !currentUser
});

const topTags: TagWithCommentCount[] | undefined = tagData?.UserTopTags;
const readPosts: PostYouveRead[] | undefined = postsData?.UsersReadPostsOfTargetUser
const recommendedComments: RecommendedComment[] | undefined = commentsData?.UsersRecommendedCommentsOfTargetUser

if (!currentUser || !topTags || !readPosts || !recommendedComments) return <Loading />;
const tagsSentence = topTags.slice(0, 4).map(tag => tag.tag.name).join(', ');
const numRecommendations = (readPosts?.length ?? 0) + (recommendedComments?.length ?? 0) + (tagsSentence === "" ? 0 : 1);
const numShown = isExpanded ? numRecommendations : 2
const numHidden = Math.max(0, numRecommendations - numShown);

const allRecommendations: {reactIconName: string, prefix: string, Content: JSX.Element}[] = [
  ...(topTags.length > 0 ? [{reactIconName: "examples", prefix: "top tags: ", Content: <>{tagsSentence}</>}] : []),
  ...readPosts.map(post => ({reactIconName: "elaborate", prefix: "post: ", Content: 
    <PostsTooltip postId={post._id}>
      <Link to={postGetPageUrl(post)}> {post.title} </Link>
    </PostsTooltip>})),
  ...recommendedComments.map(comment => ({reactIconName: "elaborate", prefix: "comment: ", Content: <CommentView comment={comment} />}))
]

const toggleExpansion = () => {
  setIsExpanded(!isExpanded);
  captureEvent("toggle_expansion_inside_match_form")
};

if (allRecommendations.length === 0) return null;

return (
  <AnalyticsContext pageElementContext={'userRecommendedContent'} >
    <div className={classes.contentRecommendationsCard} >
      <div className={classes.cardTitle}>
        Recommended content
      </div>
      <div className={classNames(classes.recommendedContentContainer, {
        [classes.recommendedContentContainerExpandedMobile]: isExpanded})}>
        <div className={classes.contentRecommendationsList}>
          {allRecommendations.slice(0, numShown).map( (item, index) => <TopicSuggestion key={index} reactIconName={item.reactIconName} prefix={item.prefix} Content={item.Content} isExpanded={isExpanded} />) } 
        </div>
        <div className={classes.recommendedContentRightContainer}>
          <ExpandCollapseText isExpanded={isExpanded} numHidden={numHidden} toggleExpansion={toggleExpansion} />
        </div>
      </div>
    </div>
  </AnalyticsContext>)
}

const NextStepsDialog = ({ onClose, userId, targetUserId, targetUserDisplayName, matchPreference, reciprocalMatchPreference, dialogueCheckId, classes }: NextStepsDialogProps) => {
  const { LWDialog, ReactionIcon, LWTooltip, CalendlyIFrame } = Components;

  const [topicNotes, setTopicNotes] = useState(matchPreference?.topicNotes ?? "");
  const [formatSync, setFormatSync] = useState<SyncPreference>(matchPreference?.syncPreference ?? "Meh");
  const [formatAsync, setFormatAsync] = useState<SyncPreference>(matchPreference?.asyncPreference ?? "Meh");
  const [formatNotes, setFormatNotes] = useState(matchPreference?.formatNotes ?? "");
  const showRecommendedContent = useABTest(showRecommendedContentInMatchForm);
  const initialCalendlyLink = validatedCalendlyUrl(matchPreference?.calendlyLink ?? "");
  const [calendlyLink, setCalendlyLink] = useState(initialCalendlyLink);
  const { location, query, params } = useLocation();

  const calendlyAB = useABTest(offerToAddCalendlyLink);

  const { create, called, loading: loadingCreatedMatchPreference, data: newMatchPreference } = useCreate({
    collectionName: "DialogueMatchPreferences",
    fragmentName: "DialogueMatchPreferencesDefaultFragment",
  })

  const navigate = useNavigate();

  const onAddTopic = () => {
    if (topicNotes === '') return
    setTopicPreferences([...topicPreferences, {
      text: topicNotes,
      preference: 'Yes' as const, 
      commentSourceId: null,
      recommendationReason: "You suggested this topic"
    }])
    setTopicNotes('')
  }

  const onCloseWrapper = () => {
    // used to remove query parameters if user clicks outside the dialog
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('dialogueCheckId');
    navigate({ ...location, search: `?${searchParams.toString()}`  });
  
    onClose();
  };

  const onSubmit = async () => {
    let updatedTopicPreferences = topicPreferences; // making sure any mistakenly unsubmitted text in the topic notes field actually gets submitted and not lost
    if (topicNotes !== '') {
      updatedTopicPreferences = [...topicPreferences, {
        text: topicNotes,
        preference: 'Yes' as const, 
        commentSourceId: null,
        recommendationReason: "You suggested this topic"
      }];
      setTopicNotes(''); 
    }
  
    const response = await create({
      data: {
        dialogueCheckId: dialogueCheckId,
        topicPreferences: updatedTopicPreferences.map(topic => ({...topic, preference: topic.preference ?? "No", matchedPersonPreference: undefined, recommendationReason: undefined, theirVote: undefined, yourVote: undefined})),
        topicNotes: topicNotes,
        syncPreference: formatSync,
        asyncPreference: formatAsync,
        formatNotes: formatNotes,
        calendlyLink: calendlyLink.valid ? calendlyLink.url : undefined,
      }
    });

    const redirectId = response.data?.createDialogueMatchPreference.data.generatedDialogueId
    
    if (redirectId) {
      redirect(redirectId, navigate)
      onClose()
    }
  }

  const { loading, error, data } = useQueryWrapped(gql`
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
    variables: { userId, targetUserId, limit:4 },
  });


  const topicRecommendations: {comment: {_id: string, contents: {html: string, plaintextMainText: string}}, recommendationReason: string, yourVote: string, theirVote: string}[] | undefined = data?.GetTwoUserTopicRecommendations; // Note CommentsList is too permissive here, but making my own type seemed too hard

  const getTopicDict = (prefs: DialogueMatchPreferencesDefaultFragment, own: boolean): {[topic: string]: ExtendedDialogueMatchPreferenceTopic} => {
    const prefsDictList = prefs.topicPreferences
      .filter(({preference}) => preference === "Yes")
      .map(topic => [topic.text, {...topic, preference: own ? "Yes" : undefined, matchedPersonPreference: own ? undefined : "Yes"}])
    return Object.fromEntries(prefsDictList)  
  }
  const ownTopicDict = matchPreference ? getTopicDict(matchPreference, true) : {}
  const matchedPersonTopicDict = reciprocalMatchPreference ? getTopicDict(reciprocalMatchPreference, false) : {}
  const initialTopicDict = mergeWith(ownTopicDict, matchedPersonTopicDict, (ownTopic, matchedPersonTopic) =>
    ({...matchedPersonTopic, preference: undefined, ...ownTopic})
  )
  const [topicPreferences, setTopicPreferences] = useState<ExtendedDialogueMatchPreferenceTopic[]>(Object.values(initialTopicDict))

  // Once we get the topic recommendations from the query, merge them into the topic preferences
  useEffect(() => setTopicPreferences(topicPreferences => {
    if (topicRecommendations == null) return topicPreferences
    const existingTopicDict = keyBy(topicPreferences, ({text}) => text)
    const newRecommendedTopicDict = keyBy(topicRecommendations.map(({comment, recommendationReason, yourVote, theirVote}) => ({
      text: comment.contents?.plaintextMainText ?? '',
      preference: 'No' as const,
      commentSourceId: comment._id,
      recommendationReason,
      yourVote, theirVote
    })), ({text}) => text)
    return Object.values(merge(existingTopicDict, newRecommendedTopicDict))
  }), [topicRecommendations])

  const [recommendedTopics, userSuggestedTopics]  = partition(topicPreferences, topic => topic.matchedPersonPreference !== "Yes")

  if (called && !loadingCreatedMatchPreference && !(newMatchPreference as any)?.createDialogueMatchPreference?.data?.generatedDialogueId) {
    return (
      <LWDialog open onClose={onCloseWrapper}>
          <DialogTitle>
            <h2>You submitted, nice job.</h2>
            <p>This info will be sent to your match partner.</p> 
            <p>Once they fill out the form, you'll get to see each other's answers and chat about whether a dialogue makes sense.</p>
          </DialogTitle>
          <div style={{textAlign: "center"}}>
            <img style={{maxHeight: "50px"}} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1497915096/favicon_lncumn.ico"></img>
          </div>
          <DialogActions>
            <Button onClick={onCloseWrapper} color="default">
              Close
            </Button>
          </DialogActions>
      </LWDialog>
  )}
 
  const ScheduleLabels = ({extraClass}: {extraClass?: string}) => <>
    <label className={classNames(classes.dialogueFormatLabel, extraClass)}>Great</label>
    <label className={classNames(classes.dialogueFormatLabel, extraClass)}>Okay</label>
    <label className={classNames(classes.dialogueFormatLabel, extraClass)}>No</label>
  </>

  return (
    <LWDialog open onClose={onCloseWrapper} className={classes.mobileDialog}>
      <div className={classes.dialogBox}>
        <DialogTitle className={classes.dialogueTitle}><span className={classes.matchHeader}>(Match)</span> {targetUserDisplayName}</DialogTitle>
        <DialogContent >
          {showRecommendedContent === "show" &&  <UserRecommendedContent targetUserId={targetUserId} classes={classes} />}
          <h3 className={classes.sectionHeader}>Topics</h3>
          {userSuggestedTopics.length > 0 && <>
            <div className={classes.topicsOrigin} >{targetUserDisplayName} was interested in the below. Check ones you like.</div>
            <div className={classes.dialogueTopicList}>
              {userSuggestedTopics.map((topic) => <div className={classes.dialogueTopicRow} key={topic.text}>
                <Checkbox 
                    className={classes.dialogueTopicRowTopicCheckbox}
                    color={topic.matchedPersonPreference === "Yes" ? "primary" : "default"}
                    checked={topic.preference === "Yes"}
                    // Set the preference of the topic with the matching text to the new preference
                    onChange={event => {
                      const topicToUpdateIx = topicPreferences.findIndex(({text}) => text === topic.text)
                      const updatedTopic = {...topicPreferences[topicToUpdateIx], preference: event.target.checked ? "Yes" as const : "No" as const}
                      setTopicPreferences([...topicPreferences.slice(0, topicToUpdateIx), updatedTopic, ...topicPreferences.slice(topicToUpdateIx + 1)])
                    }
                  }
                  />
                  <div className={classes.dialogueTopicRowTopicText}>
                    {topic.text}
                  </div>
              </div>)}
            </div></>}
            <div className={classes.topicsOrigin}>Suggested</div>
            <div className={classes.dialogueTopicList}>
              {recommendedTopics.map((topic) => <div className={classes.dialogueTopicRow} key={topic.text}>
                <Checkbox 
                    className={classes.dialogueTopicRowTopicCheckbox}
                    color={topic.matchedPersonPreference === "Yes" ? "primary" : "default"}
                    checked={topic.preference === "Yes"}
                    // Set the preference of the topic with the matching text to the new preference
                    onChange={event => {
                      const topicToUpdateIx = topicPreferences.findIndex(({text}) => text === topic.text)
                      const updatedTopic = {...topicPreferences[topicToUpdateIx], preference: event.target.checked ? "Yes" as const : "No" as const}
                      setTopicPreferences([...topicPreferences.slice(0, topicToUpdateIx), updatedTopic, ...topicPreferences.slice(topicToUpdateIx + 1)])
                    }
                  }
                  />
                  <div className={classes.dialogueTopicRowTopicText}>
                    {topic.text}
                  </div>
                  <span className={classes.recommendationReasons}>
                    {topic.yourVote && <LWTooltip title={`You reacted with ${topic.yourVote} to this`}><ReactionIcon size={13} react={topic.yourVote} /></LWTooltip>}
                    {topic.theirVote && <LWTooltip title={`${targetUserDisplayName} reacted with ${topic.theirVote} to this`}><ReactionIcon size={13} react={topic.theirVote} /></LWTooltip>}
                    {topic.recommendationReason === "This comment is popular" && <LWTooltip title="This comment is popular"><ReactionIcon size={13} react={"excitement"} /></LWTooltip>}
                  </span>
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
              <Button color="default" onClick={e => onAddTopic() }>
                Add Topic
              </Button>
            </div>
            <br className={classes.mobileBreak} />
            <div className={classes.dialogueFormatGrid}>
              <h3 className={classes.sectionHeader}>Format</h3>
              <ScheduleLabels />
                <div className={classes.schedulingQuestion}><span className={classes.syncText}>Sync:</span> Find a synchronous 1-3hr block to sit down and dialogue</div>
                {SYNC_PREFERENCE_VALUES.map((value, idx) => <Checkbox 
                    key={value}
                    checked={formatSync === value}
                    className={classes.dialogSchedulingCheckbox}
                    onChange={event => setFormatSync(value as SyncPreference)}
                    />)}
                <div className={classes.schedulingQuestion}><span className={classes.syncText}>Async:</span> Have an asynchronous dialogue where you reply where convenient</div>
                {SYNC_PREFERENCE_VALUES.map((value, idx) => <Checkbox 
                    key={value}
                    checked={formatAsync === value}
                    className={classes.dialogSchedulingCheckbox}
                    onChange={event => setFormatAsync(value as SyncPreference)}
                />)}
            </div>      
            { calendlyAB === "show" && <TextField
              variant="outlined"
              label="You can share a calendly link for easier scheduling"
              rows={2}
              error={!calendlyLink.valid}
              helperText={!calendlyLink.valid && "Please enter a valid calendly link"}
              fullWidth
              value={calendlyLink.url ?? ""}
              margin="normal"
              onChange={event => setCalendlyLink(validatedCalendlyUrl(event.target.value))}
            /> }
            { calendlyLink.valid && calendlyLink.url && <>
              <h3 className={classes.sectionHeader}>A preview of what we'll show your partner</h3>
              <CalendlyIFrame url={calendlyLink.url} />
            </>}
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
          <Button onClick={onCloseWrapper} color="default">
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
  targetUserId: string;
  targetUserDisplayName: string;
  checkId?: string;
  isChecked: boolean, 
  isMatched: boolean;
  hideInRecommendations?: boolean;
  classes: ClassesType<typeof styles>;
}> = ({ targetUserId, targetUserDisplayName, checkId, isChecked, isMatched, hideInRecommendations, classes}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { openDialog } = useDialog();
  
  async function handleNewMatchAnonymisedAnalytics() {
    captureEvent("newDialogueReciprocityMatch", {}) // we only capture match metadata and don't pass anything else

    // ping the slack webhook to inform team of match. YOLO:ing and putting this on the client. Seems fine: but it's the second time this happens, and if we're doing it a third time, I'll properly move it all to the server 
    const webhookURL = isProduction ? "https://hooks.slack.com/triggers/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" : "https://hooks.slack.com/triggers/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"  //
    const data = {} // Not sending any data for now 
    void pingSlackWebhook(webhookURL, data)
  }

  const [showConfetti, setShowConfetti] = useState(false);
  const upsertUserDialogueCheck = useUpsertDialogueCheck();

  async function updateDatabase(event: React.ChangeEvent<HTMLInputElement>, targetUserId: string, checkId?: string) {
    if (!currentUser) return;

    const response = await upsertUserDialogueCheck({ targetUserId, checked: event.target.checked, checkId });

    captureEvent("newDialogueCheck", {checked: response.data.upsertUserDialogueCheck.checked}) 
    
    if (response.data.upsertUserDialogueCheck.match) {
      void handleNewMatchAnonymisedAnalytics()
      setShowConfetti(true);
      openDialog({
        componentName: 'NextStepsDialog',
        componentProps: {
          userId: currentUser?._id,
          targetUserId,
          targetUserDisplayName,
          matchPreference: response.data.upsertUserDialogueCheck.matchPreference, 
          reciprocalMatchPreference: response.data.upsertUserDialogueCheck.reciprocalMatchPreference,
          dialogueCheckId: response.data.upsertUserDialogueCheck._id,
          dialogueCheck: response.data.upsertUserDialogueCheck
        }
      });
    }
  }

  return (
    <AnalyticsContext pageElementContext={"dialogueCheckBox"}>
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
    </AnalyticsContext>
    
  );
};

const DialogueNextStepsButton: React.FC<DialogueNextStepsButtonProps> = ({
  isMatched,
  checkId,
  targetUserId,
  targetUserDisplayName,
  currentUser,
  matchPreference,
  reciprocalMatchPreference,
  classes,
}) => {
  const { ReactionIcon } = Components;

  const { openDialog } = useDialog();

  const navigate = useNavigate();

  const generatedDialogueId = matchPreference?.generatedDialogueId;

  if (!!generatedDialogueId) {
    return (
      <button className={classes.lightGreenButton} onClick={(e) => redirect(generatedDialogueId, navigate)}>
        <a>Go to dialogue</a>
      </button>
    );
  }

  if (matchPreference) {
    return (
      <div className={classes.waitingMessage}>
        Waiting for {targetUserDisplayName}...
      </div>
    );
  }

  return (
    <button
      className={classNames(classes.enterTopicsButton, {
        [classes.hideAtXs]: !isMatched,
        [classes.lightGreenButton]: !!reciprocalMatchPreference,
      })}
      onClick={(e) => {
        openDialog({
          componentName: 'NextStepsDialog',
          componentProps: {
            userId: currentUser?._id,
            targetUserId,
            targetUserDisplayName,
            matchPreference,
            reciprocalMatchPreference,
            dialogueCheckId: checkId,
          }
        })
      }}
    >
      <a>{reciprocalMatchPreference ? "Enter your topics" : "Enter topics"}</a>
    </button>
  );
};

const MessageButton: React.FC<{
  targetUserId: string;
  currentUser: UsersCurrent;
  isMatched: boolean;
  classes: ClassesType<typeof styles>;
}> = ({ targetUserId, currentUser, isMatched, classes }) => {
  const { NewConversationButton } = Components;
  
  return (
    <button className={classNames(classes.messageButton, {
      [classes.hideAtXs]: isMatched,
    })}>
      <NewConversationButton user={{_id: targetUserId}} currentUser={currentUser}>
        <a>Message</a>
      </NewConversationButton>
    </button>
  );
};


const DialogueUserRow = <V extends boolean>(props: DialogueUserRowProps<V> & { classes: ClassesType }): JSX.Element => {
  const { targetUser, checkId, userIsChecked, userIsMatched, classes, currentUser, showKarma, showAgreement, showBio, showFrequentCommentedTopics, showPostsYouveRead, matchPreference, reciprocalMatchPreference } = props;
  const { UsersName, DialogueCheckBox, MessageButton, DialogueNextStepsButton, ReactionIcon } = Components;


  return <React.Fragment key={`${targetUser._id}_other`} >
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
      isMatched={userIsMatched}
    />
    { !userIsMatched ? 
      <div className={classes.hideAtXs}></div> // need this instead of null to keep the table columns aligned
      : <div className={classes.dialogueEnterTopicsButtonContainer}>
          <DialogueNextStepsButton
            isMatched={userIsMatched}
            checkId={checkId}
            targetUserId={targetUser._id}
            targetUserDisplayName={targetUser.displayName}
            currentUser={currentUser}
            reciprocalMatchPreference={reciprocalMatchPreference}
          />
          {!matchPreference && reciprocalMatchPreference && 
            <div className={classes.enterTopicsAnnotation}> 
              <ReactionIcon size={10} react={"agree"} /> {targetUser.displayName}
            </div>
          }
        </div>}
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
    tableContext,
    ...rest
  } = props;

  const { DialogueUserRow } = Components;

  const headers = [
    headerTexts.dialogue,
    headerTexts.name,
    headerTexts.message,
    headerTexts.match,
    ...(rest.showKarma ? [headerTexts.karma] : []),
    ...(rest.showAgreement ? [headerTexts.agreement] : []),
    ...(rest.showBio ? [headerTexts.bio] : []),
    ...(rest.showFrequentCommentedTopics ? [headerTexts.tags] : []),
    ...(rest.showPostsYouveRead ? [headerTexts.postsRead] : []),
  ];

  const headerClasses = {
    [headerTexts.bio]: [classes.hideAtSm],
    [headerTexts.tags]: [classes.hideAtSm],
    [headerTexts.karma]: [classes.hideAtXs],
    [headerTexts.agreement]: [classes.hideAtXs],
    [headerTexts.postsRead]: [tableContext === 'upvoted' ? classes.hideAtSm : classes.hideAtXs],
    [headerTexts.match]: [tableContext === 'match' ? '' : classes.hideAtXs],
    [headerTexts.message]: [tableContext === 'match' ? classes.hideAtXs : ''],
  }

  const allRowProps = getRowProps(props);
  const rows = allRowProps.map((rowProps) => <DialogueUserRow key={rowProps.targetUser._id} {...rowProps} />);

  return (
    <div className={gridClassName}>
      {showHeaders && <Headers titles={headers} classes={classes} headerClasses={headerClasses} />}
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
  const { query } = useLocation()
  const { openDialog } = useDialog();
  const [optIn, setOptIn] = React.useState(currentUser?.revealChecksToAdmins); // for rendering the checkbox

  const { Loading, LoadMore, IntercomWrapper } = Components;

  const {
    matchedUsersQueryResult: { data: matchedUsersResult },
    userDialogueChecksResult: { results: userDialogueChecks },
    usersOptedInResult: { results: usersOptedInToDialogueFacilitation, loadMoreProps: optedInUsersLoadMoreProps }
  } = useDialogueMatchmaking(currentUser, { getMatchedUsers: true, getOptedInUsers: true, getUserDialogueChecks: { limit: 1000 } });

  const { loading, error, data } = useQueryWrapped(gql`
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
        activeDialogueMatchSeekers {
          _id
          displayName
        }
       }
    }
  `, {skip: !currentUser || !dialogueMatchmakingEnabled.get()});

  const openFormDialogueCheckId = query?.dialogueCheckId;
  const { document: openFormDialogueCheck } = useSingle({
    collectionName: "DialogueChecks",
    fragmentName: 'DialogueCheckInfo',
    documentId: openFormDialogueCheckId,
    skip: !openFormDialogueCheckId
  });

  const { document: openFormTargetUser } = useSingle({
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
    documentId: openFormDialogueCheck?.targetUserId,
    skip: !openFormDialogueCheck
  });

  if (!dialogueMatchmakingEnabled.get()) return <p>Server overloaded... we're working on getting it back up!!</p>

  if (!currentUser) return <p>You have to be logged in to view this page</p>

  if (loading) {
    return <Loading />;
  } else if (!usersOptedInToDialogueFacilitation) {
    return <p>Error...</p>;
  }

  const userDialogueUsefulData: UserDialogueUsefulData = data?.GetUserDialogueUsefulData;

  const matchedUsersWithSelf: UsersOptedInToDialogueFacilitation[] | undefined = matchedUsersResult?.GetDialogueMatchedUsers
  const matchedUsers = matchedUsersWithSelf?.filter(user => user._id !== currentUser._id)
  const matchedUserIds = matchedUsers?.map(user => user._id) ?? [];
  const topUsers = userDialogueUsefulData?.topUsers.filter(user => !matchedUserIds.includes(user._id));
  const recentlyActiveTopUsers = topUsers.filter(user => user.recently_active_matchmaking)
  const nonRecentlyActiveTopUsers = topUsers.filter(user => !user.recently_active_matchmaking)
  const dialogueUsers = userDialogueUsefulData?.dialogueUsers.filter(user => !matchedUserIds.includes(user._id) && !(user._id === currentUser._id));
  const optedInUsers = usersOptedInToDialogueFacilitation.filter(user => !matchedUserIds.includes(user._id) && !(user._id === currentUser._id));
  const activeDialogueMatchSeekers = userDialogueUsefulData?.activeDialogueMatchSeekers.filter(user => !matchedUserIds.includes(user._id) && !(user._id === currentUser._id));
  
  if (loading) return <Loading />
  if (error || !userDialogueChecks || userDialogueChecks.length > 1000) return <p>Error </p>; // if the user has clicked that much stuff things might break...... 
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

  if (!!openFormDialogueCheck && !!openFormTargetUser) {
    openDialog({
      componentName: 'NextStepsDialog',
      componentProps: {
        userId: currentUser._id,
        targetUserId: openFormDialogueCheck.targetUserId,
        targetUserDisplayName: openFormTargetUser.displayName,
        matchPreference: openFormDialogueCheck.matchPreference ?? undefined,
        reciprocalMatchPreference: openFormDialogueCheck.reciprocalMatchPreference ?? undefined,
        dialogueCheckId: openFormDialogueCheck._id,
      }
    })
  }

  return (
  <AnalyticsContext pageContext={"dialogueMatchingPage"}>
    <div className={classes.root}>
      <div className={classes.container}>

        <h1>Dialogue Matching</h1>
        <ul>
          <li>Check a user you'd maybe be interested in having a dialogue with, if they were too</li>
          <li>They can't see your checks unless you match</li>
          <li>If you match, you'll both get a tiny form to enter topic ideas</li>
          <li>You can then see each other's answers, and choose whether start a dialogue</li>
        </ul>
        
        <CheckNotificationControl classes={classes} />
        <div className={classes.optInContainer}>
          <FormControlLabel className={classes.optionControlLabel}
            control={
              <Checkbox
                checked={optIn}
                onChange={event => handleOptInToRevealDialogueChecks(event)}
                name="optIn"
                color="primary"
                className={classes.optionControlCheckbox}
              />
            }
            label={null}
          />{prompt}
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
              tableContext={'match'}
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
            { recentlyActiveTopUsers.length === 0 ? null : <>
            <h4>Recently active on dialogue matching (last 10 days)</h4>
            <UserTable
              users={recentlyActiveTopUsers}
              tableContext={'upvoted'}
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
        { nonRecentlyActiveTopUsers.length === 0 ? null : <>
              <h4>Not recently active on dialogue matching</h4>
              <UserTable
                users={nonRecentlyActiveTopUsers}
                tableContext={'upvoted'}
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
          <h3>Recently active on dialogue matching</h3>
          <UserTable
            users={activeDialogueMatchSeekers}
            tableContext={'other'}
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
      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>Published dialogues</h3>
          <UserTable
            users={dialogueUsers}
            tableContext={'other'}
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
          <h3>Opted in to matchmaking</h3>
          <UserTable
            users={optedInUsers}
            tableContext={'other'}
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
      <br />
      <IntercomWrapper />
    </div>
  </AnalyticsContext>)
}

const NoSSRMatchingPage = (props: { classes: ClassesType<typeof styles> }) => (
  <ForumNoSSR if={useABTest(dialogueMatchingPageNoSSRABTest) === "noSSR"}>
    <DialogueMatchingPage {...props} />
  </ForumNoSSR>
);

const DialogueNextStepsButtonComponent = registerComponent('DialogueNextStepsButton', DialogueNextStepsButton, {styles});
const MessageButtonComponent = registerComponent('MessageButton', MessageButton, {styles});
const DialogueCheckBoxComponent = registerComponent('DialogueCheckBox', DialogueCheckBox, {styles});
const DialogueUserRowComponent = registerComponent('DialogueUserRow', DialogueUserRow, {styles});
const DialogueMatchingPageComponent = registerComponent('DialogueMatchingPage', NoSSRMatchingPage, {styles});

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
