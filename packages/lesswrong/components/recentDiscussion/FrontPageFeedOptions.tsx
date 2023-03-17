import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useToggle } from '../../lib/utils/reactUtils';
import { useABTest } from '../../lib/abTestImpl';
import { feedModeSelectorABTest } from '../../lib/abTests';
import classNames from 'classnames';
import AddBoxIcon from '@material-ui/icons/AddBox';
import CheckIcon from '@material-ui/icons/Check';

const styles = (theme: ThemeType): JssStyles => ({
  feedModeTabBar: {
    display: "flex",
    columnGap: 16,
    background: "white",
    marginBottom: 16,
    padding: 12,
  },
  feedModeTab: {
    ...theme.typography.body2,
    cursor: "pointer",
    fontSize: 18,
    borderBottom: `2px solid ${theme.palette.greyAlpha(0.2)}`,
  },
  feedModeTabTooltip: {
  },
  selectedFeedModeTab: {
    borderBottomColor: theme.palette.greyAlpha(0.5),
  },
  
  feedOptionsForm: {
    marginBottom: 32,
    padding: 8,
    borderRadius: 8,
    background: theme.palette.greyAlpha(0.2),
  },
  feedOptionsTitle: {
    ...theme.typography.body2,
    marginLeft: 8,
    paddingTop: 4,
    fontWeight: "bold",
  },
  feedOptionsButtons: {
    display: "flex",
    columnGap: 8,
  },
  feedModeButton: {
    ...theme.typography.body2,
    position: "relative",
    background: "white",
    margin: 8,
    paddingRight: 12,
    paddingBottom: 12,
    paddingTop: 10,
    paddingLeft: 40,
    borderRadius: 8,
    cursor: "pointer",
  },
  feedModeCheckbox: {
    position: "absolute",
    top: 8, left: 10,
    color: "#0a0",
  },
  selectedFeedModeButton: {
  },
  feedModeButtonTitle: {
    fontWeight: "bold",
  },
});

export interface FrontPageFeedOptions {
  mode: "latest"|"magic"
}

const feedModes = {
  latest: {
    label: "Latest",
    description: "Shows front-page posts, sorted by how recently they've received comments.",
  },
  magic: {
    label: "Recommended",
    description: "Shows recommended posts, based on a combination of recent activity, karma, and your tag filters.",
  },
} as const;

const FrontPageFeedOptions = (props: {
  options: FrontPageFeedOptions,
  setOptions: (newOptions: FrontPageFeedOptions)=>void,
  refetchRef: React.RefObject<null|(()=>void)>
  classes: ClassesType,
}) => {
  const selectorType = useABTest(feedModeSelectorABTest);
  switch(selectorType) {
    case "recentDiscussionOnly":
    default:
      return <FrontPageFeedOptionsLegacy {...props}/>
    case "gearIcon":
      return <FrontPageFeedOptionsGearIcon {...props}/>
    case "tabbed":
      return <FrontPageFeedOptionsTabbed {...props}/>
  };
}

// Front-page feed options variant: Legacy (Recent Discussion only)
const FrontPageFeedOptionsLegacy = ({options, setOptions, refetchRef, classes}: {
  options: FrontPageFeedOptions,
  setOptions: (newOptions: FrontPageFeedOptions)=>void,
  refetchRef: React.RefObject<null|(()=>void)>
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { SectionTitle, SectionButton, ShortformSubmitForm } = Components;
  const [showShortformCommentBox, toggleShortformCommentBox] = useToggle(false);

  const title = "Recent Discussion";
  const showShortformButton = currentUser?.isReviewed && !currentUser.allCommentingDisabled
  
  return <>
    <SectionTitle title={title}>
      {showShortformButton && <div onClick={toggleShortformCommentBox}>
        <SectionButton>
          <AddBoxIcon />
          New Shortform Post
        </SectionButton>
      </div>}
    </SectionTitle>

    {showShortformCommentBox && <ShortformSubmitForm successCallback={() => refetchRef.current?.()}/>}
  </>
}

// Front-page feed options variant: Tabbed
const FrontPageFeedOptionsTabbed = ({options, setOptions, refetchRef, classes}: {
  options: FrontPageFeedOptions,
  setOptions: (newOptions: FrontPageFeedOptions)=>void,
  refetchRef: React.RefObject<null|(()=>void)>
  classes: ClassesType,
}) => {
  const {LWTooltip, SectionTitle} = Components;
  const title = (options.mode=="latest" ? "Recent Discussion" : "Recommended Posts");

  return <>
    <SectionTitle title={title}/>
    <div className={classes.feedModeTabBar}>
      {Object.entries(feedModes).map(([mode,{label,description}]) =>
        <LWTooltip key={mode} title={<div className={classes.feedModeTabTooltip}>
          {description}
        </div>}>
          <div
            className={classNames(classes.feedModeTab, {[classes.selectedFeedModeTab]: options.mode===mode})}
            onClick={() => setOptions({mode: mode as any})}
          >
            {label}
          </div>
        </LWTooltip>
      )}
    </div>
  </>
}

// Front-page feed options variant: Gear-icon expander
const FrontPageFeedOptionsGearIcon = ({options, setOptions, refetchRef, classes}: {
  options: FrontPageFeedOptions,
  setOptions: (newOptions: FrontPageFeedOptions)=>void,
  refetchRef: React.RefObject<null|(()=>void)>
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { SectionTitle, SectionButton, ShortformSubmitForm, SettingsButton } = Components;
  const [showShortformCommentBox, toggleShortformCommentBox] = useToggle(false);
  const [showOptions,toggleShowOptions] = useToggle(false);
  
  const title = (options.mode=="latest" ? "Recent Discussion" : "Recommended Posts");
  const showShortformButton = currentUser?.isReviewed && !currentUser.allCommentingDisabled
  
  return <>
    <SectionTitle title={title}>
      <SectionButton>
        <SettingsButton onClick={toggleShowOptions} label="Options"/>
      </SectionButton>
    </SectionTitle>

    {showOptions && <div className={classes.feedOptionsForm}>
      <div className={classes.feedOptionsTitle}>Feed Mode</div>
      <div className={classes.feedOptionsButtons}>
        {Object.entries(feedModes).map(([mode,{label,description}]) =>
          <div
            key={mode}
            className={classNames(
              classes.feedModeButton,
              {[classes.selectedFeedModeButton]: options.mode===mode}
            )}
            onClick={() => setOptions({mode: mode as any})}
          >
            {options.mode===mode && <div className={classes.feedModeCheckbox}><CheckIcon/></div>}
            <div className={classes.feedModeButtonTitle}>{label}</div>
            <div className={classes.feedModeButtonText}>{description}</div>
          </div>
        )}
      </div>
    </div>}

    {showShortformCommentBox && <ShortformSubmitForm successCallback={() => refetchRef.current?.()}/>}
  </>
}

export function getInitialFrontPageFeedOptions(currentUser: UsersCurrent|null): FrontPageFeedOptions {
  return {mode: "latest"};
}

const FrontPageFeedOptionsComponent = registerComponent('FrontPageFeedOptions', FrontPageFeedOptions, {styles});

declare global {
  interface ComponentTypes {
    FrontPageFeedOptions: typeof FrontPageFeedOptionsComponent
  }
}

