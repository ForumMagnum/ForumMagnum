import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '../../lib/reactRouterWrapper';
import { PostsItem } from "../posts/PostsItem";
import { SectionButton } from "../common/SectionButton";
import { SettingsButton } from "../icons/SettingsButton";
import { LWTooltip } from "../common/LWTooltip";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { SectionSubtitle } from "../common/SectionSubtitle";
import { DialoguesSectionFrontpageSettings } from "./DialoguesSectionFrontpageSettings";
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
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
  subsection: {
    marginBottom: theme.spacing.unit,
  },
  prompt: {
    color: theme.palette.lwTertiary.main,
    fontWeight: 645,
  },
  subheading: {
    marginTop: '10px',
  },

  dialogueUserRow: { 
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
  dialogueRightContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: 10,
    marginRight: 3,
    marginLeft: 'auto',
  },
  dialogueSectionSettings: {
    display: "flex",
    alignItems: "end",
  },
  settingsButton: {
    cursor: "pointer",
    marginLeft: "5px",
  },
  link: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.light,
    }
  },
  closeIcon: { 
    color: theme.palette.grey[500],
    opacity: 0.5,
    padding: 2,
  },
});
 
const DialoguesListInner = ({ currentUser, classes }: { currentUser: UsersCurrent, classes: ClassesType<typeof styles> }) => {
  const [showSettings, setShowSettings] = useState(false);
  const { captureEvent } = useTracking();
  const currentDate = new Date();
  const isEvenDay = currentDate.getUTCDate() % 2 === 0;
  const showReciprocityRecommendations = (currentUser.karma > 100) && isEvenDay; // hide reciprocity recommendations if user has less than 100 karma, or if the current day is not an even number (just a hack to avoid spamming folks)

  const { results: dialoguePosts } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  const { results: myDialogues } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "MyDialogues",
    limit: 3,
  });

  const renderMyDialogues = myDialogues?.length && currentUser.showMyDialogues;

  const dialoguesTooltip = (<div>
    <p>Dialogues between a small group of users. Click to see more.</p>
  </div>);

  const myDialoguesTooltip = (<div>
    <div>These are the dialogues you are involved in (both drafts and published)</div>
  </div>);

  const dialogueSettingsTooltip = (<div>
    <p> Adjust which items are shown or hidden in the Dialogues section.</p>
  </div>);

  const dialogueSettingsSectionTitle = (
      <LWTooltip placement="top-start" title={dialogueSettingsTooltip}>
        <SettingsButton label={``} onClick={() => setShowSettings(!showSettings)} />
      </LWTooltip>
  );

  const dialogueSectionSettings = showSettings && (
    <DialoguesSectionFrontpageSettings
      hidden={false}
      currentShowDialogues={!!currentUser.showDialoguesList}
      currentShowMyDialogues={!!currentUser.showMyDialogues}
    />
  );

  const dialoguesList = currentUser.showDialoguesList && dialoguePosts?.map((post, i: number) => (
    <PostsItem
      key={post._id} post={post}
      showBottomBorder={i < dialoguePosts.length - 1}
    />
  ));

  const myDialoguesList = renderMyDialogues && (
    <div className={classes.subsection}>
      <AnalyticsContext pageSubSectionContext="myDialogues">
        <LWTooltip placement="top-start" title={myDialoguesTooltip}>
          <Link to={"/dialogues"}>
            <SectionSubtitle className={classes.subheading}>
              My Dialogues (only visible to you)
            </SectionSubtitle>
          </Link>
        </LWTooltip>
        {myDialogues?.map((post, i: number) => <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < myDialogues.length - 1} />
        )}
      </AnalyticsContext>
    </div>
  );

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <SingleColumnSection>
      <SectionTitle href="/dialogues"
        title={<LWTooltip placement="top-start" title={dialoguesTooltip}>
          Dialogues
        </LWTooltip>}
      >
        {dialogueSettingsSectionTitle}
      </SectionTitle>

      {dialogueSectionSettings}
      
      {dialoguesList}
      {myDialoguesList}

   </SingleColumnSection>
  </AnalyticsContext>
}

export const DialoguesList = registerComponent('DialoguesList', DialoguesListInner, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesList
  }
}
