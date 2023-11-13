import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from '../common/withUser';
import { randomId } from '../../lib/random';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCreate } from '../../lib/crud/withCreate';
import { useNavigation } from '../../lib/routeUtil';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from "../../lib/crud/withMulti";
import ReactConfetti from 'react-confetti';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { isMobile } from '../../lib/utils/isMobile'
import {postGetEditUrl, postGetPageUrl} from '../../lib/collections/posts/helpers';
import { isProduction } from '../../lib/executionEnvironment';
import type { History } from 'history';

import Select from '@material-ui/core/Select';

//import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {SYNC_PREFERENCE_VALUES, SyncPreference} from '../../lib/collections/dialogueMatchPreferences/schema';
import { useDialog } from '../common/withDialog';
import { useDialogueMatchmaking } from '../hooks/useDialogueMatchmaking';

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
  classes: ClassesType<typeof styles>;
};

type MatchDialogueButtonProps = {
  isMatched: boolean;
  checkId: string,
  targetUserId: string;
  targetUserDisplayName: string;
  currentUser: UsersCurrent;
  classes: ClassesType<typeof styles>;
};

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20,
    ...commentBodyStyles(theme),
    background: theme.palette.background.default,
  },
  matchContainer: {
    maxWidth: 1300,
    padding: 20,
    background: theme.palette.panelBackground.default,
    borderRadius: 5,
  },
  matchContainerGridV1: {
    display: 'grid',    //      checkbox       name         message                match                 upvotes        agreement         tags    posts read
    gridTemplateColumns: `       60px          100px         80px      minmax(min-content, 300px)         100px           100px            200px     425px`,
    gridRowGap: 5,
    columnGap: 10,
    alignItems: 'center'
  },
  matchContainerGridV2: {
    display: 'grid',    //        checkbox         name         message                match                    bio    tags    posts read  
    gridTemplateColumns: `minmax(min-content, 60px) 100px minmax(min-content, 80px) minmax(min-content, 300px) 200px  200px     425px `,
    gridRowGap: 5,
    columnGap: 10,
    alignItems: 'center'
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
      // flexDirection: 'Column',
    },
  },
  schedulingPreferences: {
    display: 'flex',
    alignItems: 'center',
  },
  schedulingQuestion: {
    marginRight: 30,
    width: 400,
    paddingBottom: 15,
  },
  messageButton: {
    height: 24,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.panelBackground.darken15,
    color: theme.palette.link.unmarked,
    whiteSpace: 'nowrap',
    borderRadius: 5
  },
  enterTopicsButton: {
    height: 24,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.light,
    color: 'white',
    whiteSpace: 'nowrap',
    borderRadius: 5
  },
  lightGreenButton: {
    height: 'auto', // ???
    maxHeight: `17px`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.primary.main ,
    color: 'white',
    whiteSpace: 'nowrap'
  },
  waitingButton: {
    height: 'auto', // ???
    maxHeight: `17px`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: 'gray',
    color: 'white',
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
  },
  
  // opt-in stuff
  optInContainer: {
    height: 20,
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
});

const redirect = (redirectId: string | undefined, history: History<unknown>) => {
  if (redirectId) {
    const path = postGetEditUrl(redirectId)
    history.push(path)
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
  return userDialogueChecks?.find(check => check.targetUserId === targetUserId)?.checked || false;
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

export const getRowProps = <V extends boolean>(tableProps: Omit<UserTableProps<V>, 'classes' | 'gridClassName' | 'showHeaders'>): DialogueUserRowProps<V>[] => {
  return tableProps.users.map(targetUser => {
    const checkInfo = getUserCheckInfo(targetUser, tableProps.userDialogueChecks);
    const { users, userDialogueChecks, ...remainingRowProps } = tableProps;
  
    const rowProps = {
      targetUser,
      ...checkInfo,
      ...remainingRowProps,
    };

    return rowProps;
  }) as DialogueUserRowProps<V>[];
};

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
      })} 
      ref={bioContainerRef}
    >
      {userData?.biography?.plaintextDescription }
    </div>
  )
};

const UserPostsYouveRead = ({ classes, targetUserId, limit = 20}: { classes: ClassesType<typeof styles>, targetUserId: string, limit?: number }) => {
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
      className={classNames(classes.gradientBigTextContainer, {
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
      className={classNames(classes.gradientBigTextContainer, {
        'scrolled-to-top': isScrolledToTop,
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

const Headers = ({ titles, className }: { titles: string[], className: string }) => {
  return (
    <>
      {titles.map((title, index) => (
        <h5 key={index} className={className}> {title} </h5>
      ))}
    </>
  );
};

const Checkpoint: React.FC<{ label: string; status: 'done' | 'current' | 'not_started' }> = ({ label, status }) => {
  let backgroundColor;
  let borderColor;
  let size;
  let labelColor;

  switch (status) {
    case 'done':
      backgroundColor = 'green';
      borderColor = 'green';
      size = 15;
      labelColor = 'green';
      break;
    case 'current':
      backgroundColor = 'white';
      borderColor = 'green';
      size = 15;
      labelColor = 'black';
      break;
    case 'not_started':
    default:
      backgroundColor = '#d3d3d3'; // Lighter shade of gray
      borderColor = '#d3d3d3'; // Lighter shade of gray
      size = 10;
      labelColor = 'gray';
      break;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
        <div style={{ height: '20px', width: '2px', backgroundColor: '#d3d3d3' }}></div> {/* Lighter shade of gray */}
        <div style={{ height: size, width: size, borderRadius: '50%', backgroundColor: backgroundColor, border: `2px solid ${borderColor}`, margin: 'auto' }}></div>
        <div style={{ height: '20px', width: '2px', backgroundColor: '#d3d3d3' }}></div> {/* Lighter shade of gray */}
      </div>
      <div style={{ marginLeft: '10px', color: labelColor }}>{label}</div>
    </div>
  );
};

const DialogueProgress: React.FC<{ checkpoints: { label: string; status: 'done' | 'current' | 'not_started' }[] }> = ({ checkpoints }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    {checkpoints.map((checkpoint, index) => (
      <Checkpoint key={index} label={checkpoint.label} status={checkpoint.status} />
    ))}
  </div>
);



const NextStepsDialog = ({ onClose, userId, targetUserId, targetUserDisplayName, dialogueCheckId, classes }: NextStepsDialogProps) => {

  const [topicNotes, setTopicNotes] = useState("");
  const [formatSync, setFormatSync] = useState<SyncPreference>("No");
  const [formatAsync, setFormatAsync] = useState<SyncPreference>("No");
  const [formatNotes, setFormatNotes] = useState("");

  const { LWDialog, MenuItem } = Components;

  const { create } = useCreate({
    collectionName: "DialogueMatchPreferences",
    fragmentName: "DialogueMatchPreferencesDefaultFragment",
  })

  const { history } = useNavigation();

  const onSubmit = async () => {

    onClose()

    const response = await create({
      data: {
        dialogueCheckId: dialogueCheckId,
        topicNotes: topicNotes,
        syncPreference: formatSync,
        asyncPreference: formatAsync,
        formatNotes: formatNotes,
      }
    })

    const redirectId = response.data?.createDialogueMatchPreference.data.generatedDialogueId
    redirect(redirectId, history)
  }

  return (
    <LWDialog 
      open 
      onClose={onClose} 
      // className={classes.dialogBox}
      // PaperProps={{
      //   style: {
      //     padding: '10px', // Change this to your desired padding
      //   },
      // }}
    >
      <div className={classes.dialogBox}>
          <DialogTitle>Alright, you matched with {targetUserDisplayName}!</DialogTitle>
          <DialogContent >
              <h3>What are you interested in chatting about?</h3>
              <TextField
                multiline
                rows={4}
                variant="outlined"
                label={`Leave some suggestions for ${targetUserDisplayName}`}
                fullWidth
                value={topicNotes}
                onChange={event => setTopicNotes(event.target.value)}
              />
              <br />
              <br />
              <h3>What Format Do You Prefer?</h3>
              
              <div className={classes.schedulingPreferences}>
                <div className={classes.schedulingQuestion}>Find a synchronous 1-3hr block to sit down and dialogue</div>
                  <Select
                  value={formatSync} 
                  onChange={event => setFormatSync(event.target.value as SyncPreference)}
                  >
                    {SYNC_PREFERENCE_VALUES.map((value, idx) => <MenuItem key={idx} value={value}>{value}</MenuItem>)}
                  </Select>
              </div>

              <div className={classes.schedulingPreferences}>
                <div className={classes.schedulingQuestion}>Have an asynchronous dialogue where you reply where convenient</div>
                  <Select
                  value={formatAsync} 
                  onChange={event => setFormatAsync(event.target.value as SyncPreference)}
                  >
                    {SYNC_PREFERENCE_VALUES.map((value, idx) => <MenuItem key={idx} value={value}>{value}</MenuItem>)}
                  </Select>
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
      </div>
      <DialogActions>
        <Button onClick={onClose} color="default">
          Close
        </Button>
        <Button onClick={onSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
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
          _id
          __typename
          userId
          targetUserId
          checked
          checkedAt
          match
        }
      }
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
                    fragment DialogueCheckInfo on DialogueCheck {
                      _id
                      userId
                      targetUserId
                      checked
                      checkedAt
                      match
                    }
                  `
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
          _id: checkId || randomId(),
          __typename: 'DialogueCheck',
          userId: currentUser._id,
          targetUserId: targetUserId,
          checked: event.target.checked,
          checkedAt: new Date(),
          match: false 
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
          dialogueCheckId: checkId!
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

const MatchDialogueButton: React.FC<MatchDialogueButtonProps> = ({
  isMatched,
  checkId,
  targetUserId,
  targetUserDisplayName,
  currentUser,
  classes,
}) => {

  const { openDialog } = useDialog();
  const { history } = useNavigation();

  const {loading: userLoading, results} = useMulti({
    terms: {
      view: "dialogueMatchPreferences",
      dialogueCheckId: checkId,
      limit: 1000,
    },
    fragmentName: "DialogueMatchPreferenceInfo",
    collectionName: "DialogueMatchPreferences",
  });

  if (!isMatched) return <div></div>; // need this instead of null to keep the table columns aligned

  const userMatchPreferences = results?.[0]
  const generatedDialogueId = userMatchPreferences?.generatedDialogueId;

  const renderButton = () => {
    if (!!generatedDialogueId) {
      return (
        <button className={classes.lightGreenButton} onClick={(e) => redirect(generatedDialogueId, history)}>
          <a data-cy="message">Go to dialogue</a>
        </button>
      );
    }
  
    if (userMatchPreferences) {
      return (
        <button className={classes.waitingButton} disabled>
          <a data-cy="message">Waiting for {targetUserDisplayName}...</a>
        </button>
      );
    }
  
    return (
      <button
        className={classes.enterTopicsButton}
        onClick={(e) =>
          openDialog({
            componentName: 'NextStepsDialog',
            componentProps: {
              userId: currentUser?._id,
              targetUserId,
              targetUserDisplayName,
              dialogueCheckId: checkId!
            }
          })
        }
      >
        <a data-cy="message">Enter topics</a>
      </button>
    );
  };
  
  return <div>{renderButton()}</div>;
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
  const { UsersName, DialogueCheckBox, MessageButton, MatchDialogueButton } = Components;

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
    <MatchDialogueButton
      isMatched={userIsMatched}
      checkId={checkId}
      targetUserId={targetUser._id}
      targetUserDisplayName={targetUser.displayName}
      currentUser={currentUser}
    />
    {showKarma && <div className={classes.centeredText}> {targetUser.total_power} </div>}
    {showAgreement && <div className={classes.centeredText}> {targetUser.total_agreement} </div>}
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
      limit={8} />}
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
    "Dialogue",
    "Name",
    "Message",
    "Match",
    ...(rest.showKarma ? ["Karma"] : []),
    ...(rest.showAgreement ? ["Agreement"] : []),
    ...(rest.showBio ? ["Bio"] : []),
    ...(rest.showFrequentCommentedTopics ? ["Frequent commented topics"] : []),
    ...(rest.showPostsYouveRead ? ["Posts you've read"] : []),
  ];

  let rows;
  if (props.isUpvotedUser) {
    const allRowProps = getRowProps<true>(props);
    rows = allRowProps.map((rowProps) => <DialogueUserRow key={rowProps.targetUser._id} {...rowProps} />);
  } else {
    props.showKarma
    const allRowProps = getRowProps<false>(props);
    rows = allRowProps.map((rowProps) => <DialogueUserRow key={rowProps.targetUser._id} {...rowProps} />);
  }

  return (
    <div className={gridClassName}>
      {showHeaders && <Headers titles={headers} className={classes.header} />}
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
  
  if (!currentUser) return <p>You have to be logged in to view this page</p>

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

  if (loading) {
    return <Loading />;
  } else if (!usersOptedInToDialogueFacilitation) {
    return <p>Error...</p>;
  }

  const userDialogueUsefulData: UserDialogueUsefulData = data?.GetUserDialogueUsefulData;

  const matchedUsers: UsersOptedInToDialogueFacilitation[] | undefined = matchedUsersResult?.GetDialogueMatchedUsers;
  const matchedUserIds = matchedUsers?.map(user => user._id) || [];
  const topUsers = userDialogueUsefulData?.topUsers.filter(user => !matchedUserIds.includes(user._id));
  const recentlyActiveTopUsers = topUsers.filter(user => user.recently_active_matchmaking)
  const inRecentlyActiveTopUsers = topUsers.filter(user => !user.recently_active_matchmaking)
  const dialogueUsers = userDialogueUsefulData?.dialogueUsers.filter(user => !matchedUserIds.includes(user._id));
  const optedInUsers = usersOptedInToDialogueFacilitation.filter(user => !matchedUserIds.includes(user._id));
  
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

  return (
  <div className={classes.root}>
    <div className={classes.container}>
      {isMobile() && (
        <div className={classes.mobileWarning}>
          Dialogues matching doesn't render well on mobile right now. <br/> <br /> Please view on laptop or tablet!
        </div>
      )}

      <h1>Dialogue Matching</h1>
      <ul>
        <li>Check a user you'd potentially be interested in having a dialogue with, if they were too</li>
        <li>If you match, you'll both get a tiny form to enter topics of interest and format preferences</li>
        <li>You can then see each other's answers, and if they align you can choose to start a dialogue</li>
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
    <p className={classes.privacyNote}>On privacy: LessWrong team does not look at user’s checks. We do track metadata, like “Two users just matched”, 
      to help us know whether the feature is getting used. If one user opts in to revealing their checks we can still not see their matches, unless 
      the other part of the match has also opted in.
    </p>
    { !(matchedUsers?.length) ?  null : <React.Fragment>
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
    </React.Fragment> }
    { !topUsers.length ? null : <React.Fragment>
      <div className={classes.rootFlex}>
        <div className={classes.matchContainer}>
          <h3>Your top upvoted users (last 1.5 years)</h3>
          { recentlyActiveTopUsers.length == 0 ? null : <React.Fragment>
          <h4>Recently active</h4>
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
        </React.Fragment> }
      { inRecentlyActiveTopUsers.length == 0 ? null : <React.Fragment>
            <h4>Not recently active</h4>
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
              showHeaders={false}
            />
          </React.Fragment>}
          </div>
      </div>
      <br />
    </React.Fragment> }
    <div className={classes.rootFlex}>
      <div className={classes.matchContainer}>
        <h3>Users who published dialogues</h3>
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
        <h3>Users who opted in to dialogue matchmaking on frontpage</h3>
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
        <LoadMore {...optedInUsersLoadMoreProps} />
      </div>
    </div>
    <IntercomWrapper />
  </div>)
}

const MatchDialogueButtonComponent = registerComponent('MatchDialogueButton', MatchDialogueButton, {styles});
const MessageButtonComponent = registerComponent('MessageButton', MessageButton, {styles});
const DialogueCheckBoxComponent = registerComponent('DialogueCheckBox', DialogueCheckBox, {styles});
const DialogueUserRowComponent = registerComponent('DialogueUserRow', DialogueUserRow, {styles});
const DialogueMatchingPageComponent = registerComponent('DialogueMatchingPage', DialogueMatchingPage, {styles});

declare global {
  interface ComponentTypes {
    NextStepsDialog: typeof NextStepsDialogComponent
    MatchDialogueButton: typeof MatchDialogueButtonComponent
    MessageButton: typeof MessageButtonComponent
    DialogueCheckBox: typeof DialogueCheckBoxComponent
    DialogueUserRow: typeof DialogueUserRowComponent
    DialogueMatchingPage: typeof DialogueMatchingPageComponent
  }
}
