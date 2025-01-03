import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { TagLens } from '@/lib/arbital/useTagLenses';
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import classNames from 'classnames';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

const styles = defineStyles("LensTab", (theme: ThemeType) => ({
  lensTabsContainer: {
    gap: '4px',
    [theme.breakpoints.up('md')]: {
      alignItems: 'flex-end',
    },
    [theme.breakpoints.down('sm')]: {
      gap: '2px',
      flexWrap: 'wrap-reverse',
      display: 'flex',
      flexDirection: 'row',
    },
  },
  hideMuiTabIndicator: {
    display: 'none',
  },
  lensTabContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '40%',
      // TODO: maybe have a conditional flex-grow for 2 vs. 3+ lens tabs
      flexGrow: 1,
      gap: '0px',
    },
  },
  lensTab: {
    minWidth: 'unset',
    borderWidth: 1,
  },
  lensTabRootOverride: {
    [theme.breakpoints.down('sm')]: {
      minHeight: 'unset',
      height: '100%',
      paddingTop: 2,
      paddingBottom: 2,
    },
    borderTopLeftRadius: theme.borderRadius.small * 2,
    borderTopRightRadius: theme.borderRadius.small * 2,
  },
  tabLabelContainerOverride: {
    paddingLeft: 16,
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 0,
      paddingBottom: 4,
      width: '100%',
    },
  },
  selectedLens: {
    [theme.breakpoints.down('sm')]: {
      // border: theme.palette.border.grey400,
    },
    [theme.breakpoints.up('md')]: {
      borderStyle: 'solid',
      // These don't work with borderImageSource, maybe TODO
      // borderTopLeftRadius: theme.borderRadius.small * 2,
      // borderTopRightRadius: theme.borderRadius.small * 2,
      borderWidth: '1px 1px 0 1px',
      borderImageSource: `linear-gradient(to bottom, 
        ${theme.palette.grey[400]} 0%, 
        rgba(0,0,0,0) 100%
      )`,
      borderImageSlice: '1',
      // Needed to maintain solid top border
      borderTop: theme.palette.border.grey400
    },
  },
  nonSelectedLens: {
    background: theme.palette.panelBackground.tagLensTab,
    // Needed to avoid annoying shifting of other tabs when one is selected
    [theme.breakpoints.up('md')]: {
      borderStyle: 'solid',
      borderColor: theme.palette.background.transparent,
    }
  },
  lensLabel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 48,
    [theme.breakpoints.up('md')]: {
    },
    alignItems: 'start',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      height: 'min-content',
      gap: '4px',
    },
  },
  lensTitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    marginBottom: 0,
  },
  lensSubtitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    fontSize: '1em',
    fontWeight: 400,
    [theme.breakpoints.down('sm')]: {
      width: 'fit-content',
      display: 'block',
      textAlign: 'left',
      marginBottom: 1,
    },
  },
  newLensIcon: {
    alignSelf: 'center',
  },
}));

const LensTabBar = ({lenses, selectedLens, switchLens}: {
  lenses: TagLens[],
  selectedLens: TagLens|undefined,
  switchLens: (lensId: string) => void,
}) => {
  const classes = useStyles(styles);
  if (!(lenses.length > 1)) return null;

  return <Tabs
    value={selectedLens?._id}
    onChange={(e, newLensId) => switchLens(newLensId)}
    classes={{
      flexContainer: classes.lensTabsContainer,
      indicator: classes.hideMuiTabIndicator
    }}
  >
    {lenses.map(lens => <LensTab
      key={lens._id}
      value={lens._id}
      lens={lens}
      isSelected={selectedLens?._id === lens._id}
    />)}
    <NewLensTab key='new-lens' value='new-lens' isSelected={false} />
  </Tabs>
}

const NewLensTab = ({ value, isSelected, ...tabProps }: {
  value: string,
  isSelected: boolean,
}
  & Omit<React.ComponentProps<typeof Tab>, 'key' | 'value' | 'label'>
) => {
  const { ForumIcon } = Components;
  const classes = useStyles(styles);

  const label = <div className={classes.lensLabel}>
    <ForumIcon icon='Plus' className={classes.newLensIcon} />
  </div>;

  return (
    <div className={classes.lensTabContainer}>
      <Tab
        className={classNames(classes.lensTab, isSelected && classes.selectedLens, !isSelected && classes.nonSelectedLens)}
        value={value}
        label={label}
        classes={{ root: classes.lensTabRootOverride, labelContainer: classes.tabLabelContainerOverride }}
        {...tabProps}
      ></Tab>
    </div>
  );
}

// We need to pass through all of the props that Tab accepts in order to maintain the functionality of Tab switching/etc
const LensTab = ({ lens, value, isSelected, ...tabProps }: {
  lens: TagLens,
  value: string
  isSelected: boolean,
}
  & Omit<React.ComponentProps<typeof Tab>, 'key' | 'value' | 'label'>
) => {
  const classes = useStyles(styles);
  const lensVotingSystem = getVotingSystemByName("reactionsAndLikes");
  
  if (!lens) return null;

  const label = <div key={lens._id} className={classes.lensLabel}>
    <span className={classes.lensTitle}>{lens.tabTitle}</span>
    {lens.tabSubtitle && <span className={classes.lensSubtitle}>{lens.tabSubtitle}</span>}
    <Components.ReactionsAndLikesVote
      document={lens} collectionName="MultiDocuments" votingSystem={lensVotingSystem}
    />
  </div>;
  

  return (
    <div className={classes.lensTabContainer}>
      <Tab
        className={classNames(classes.lensTab, isSelected && classes.selectedLens, !isSelected && classes.nonSelectedLens)}
        value={value}
        label={label}
        classes={{ root: classes.lensTabRootOverride, labelContainer: classes.tabLabelContainerOverride }}
        {...tabProps}
      ></Tab>
    </div>
  );
};


const LensTabBarComponent = registerComponent('LensTabBar', LensTabBar);
const LensTabComponent = registerComponent('LensTab', LensTab);

declare global {
  interface ComponentTypes {
    LensTabBar: typeof LensTabBarComponent
    LensTab: typeof LensTabComponent
  }
}

