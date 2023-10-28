import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { useSingle } from '../../lib/crud/withSingle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { commentBodyStyles } from '../../themes/stylePiping';
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  dialogueFacilitationItem: {
    paddingTop: 12,
    paddingBottom: 12,
    position: "relative",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    '&:hover': {
      boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
    },
    ...commentBodyStyles(theme),
    lineHeight: '1.65rem',
  },
  content: {
    paddingTop: 0,
    paddingRight: 35,
    paddingLeft: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 75,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItem,
    [theme.breakpoints.down('xs')]: {
      marginRight: 10,
      paddingRight: 20,
    },
    "& p": {
      marginBottom: 0,
      marginTop: 5,
    }
  },  

  closeIcon: { 
    color: "#e0e0e0",
    position: 'absolute', 
    right: '8px',
    top: '8px',
    padding: '2px',
  },

  prompt: {
    color: theme.palette.lwTertiary.main,
    fontWeight: 645,
  }
});

const DialogueFacilitationBox = ({ classes, currentUser, setShowOptIn }: { classes: ClassesType, currentUser: UsersCurrent, setShowOptIn: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const { captureEvent } = useTracking();

  const [optIn, setOptIn] = React.useState(false); // for rendering the checkbox
  const updateCurrentUser = useUpdateCurrentUser()

  const hideOptInItem = () => {
    void updateCurrentUser({hideDialogueFacilitation: true})
    setShowOptIn(false)
  }

  const handleOptInChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptIn(event.target.checked);
    void updateCurrentUser({hideDialogueFacilitation: event.target.checked}) // show people they have clicked, but remove component from view upon refresh
    captureEvent("optInToDialogueFacilitation", {optIn: event.target.checked})
    
    const userDetailString = currentUser?.displayName + " / " + currentUser?.slug
  
    // ping the slack webhook to inform team of opt-in. YOLO:ing and putting this on the client. Seems fine. 
    const webhookURL = "https://hooks.slack.com/triggers/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";
    const data = {
      user: userDetailString,
      abTestGroup: "optIn (no more AB test)",
    };
  
    if (event.target.checked) {
      try {
        const response = await fetch(webhookURL, {
          method: 'POST',
          body: JSON.stringify(data),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error('There was a problem with the fetch operation: ', error);
      }
    }
  };

  const prompt = "Opt-in to dialogue invitations" 
 
  return (
      <div className={classes.dialogueFacilitationItem}>
        <IconButton className={classes.closeIcon} onClick={() => hideOptInItem()}>
          <CloseIcon />
        </IconButton>
        <div className={classes.content} >
          <div style={{ height: '20px', display: 'flex', alignItems: 'top' }}>
            <FormControlLabel  style={{ paddingLeft: '8px' }}
              control={
                <Checkbox
                  checked={optIn}
                  onChange={event => handleOptInChange(event)}
                  name="optIn"
                  color="primary"
                  style={{ height: '10px', width: '30px', color: "#9a9a9a" }}
                />
              }
              label={<span className={classes.prompt} >{prompt}</span>}
            />
          </div>     
          <p>
            If you tick the box, we might check in to see if we can facilitate a dialogue you'd find valuable 
            (by helping with topics, partners, scheduling or editing).  
          </p>        
        </div>
      </div>
  );
};

const DialoguesList = ({ classes }: { classes: ClassesType }) => {
  const { PostsItem, LWTooltip, SingleColumnSection, SectionTitle } = Components
  const currentUser = useCurrentUser()
  const optInStartState = !!currentUser && !currentUser?.hideDialogueFacilitation 
  const [showOptIn, setShowOptIn] = useState(optInStartState);

  const { results: dialoguePosts, error, count, loading, loadingInitial } = usePaginatedResolver({
    fragmentName: "PostsList",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
    ssr: true
  }); 

  console.log({ dialoguePosts, error, count, loading, loadingInitial })

  const {
    document: party,
  } = useSingle({
    documentId: "BJcNeJss4jxc68GQR",
    collectionName: "Posts",
    fragmentName: "PostsList",
  });

  const dialoguesTooltip = <div>
    <p>Beta feature: Dialogues between a small group of users. Click to see more.</p>
  </div>

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      />
      {showOptIn && !!currentUser && <DialogueFacilitationBox classes={classes} currentUser={currentUser} setShowOptIn={setShowOptIn} />}

      {party && <PostsItem post={party}/>}
      
      {dialoguePosts?.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}
   </SingleColumnSection>
  </AnalyticsContext>
}

const DialoguesListComponent = registerComponent('DialoguesList', DialoguesList, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesListComponent
  }
}
