import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { MAIN_TAB_ID, TagLens } from '@/lib/arbital/useTagLenses';
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
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap-reverse',
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
      // This prevents the content of the tab from overflowing the tab container on mobile in some edge cases
      // It needs to be `fit-content` rather than `min-content` because `min-content` doesn't work on Mobile Safari, for some reason
      minWidth: 'fit-content',
      maxWidth: '40%',
      // TODO: maybe have a conditional flex-grow for 2 vs. 3+ lens tabs
      flexGrow: 1,
      gap: '0px',
    },
  },
  lensTab: {
    minWidth: 'max-content',
    borderWidth: 1,
  },
  lensTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
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
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 3,
    paddingBottom: 0,
    marginBottom: -1,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 6,
      paddingRight: 6,
      paddingTop: 0,
      marginTop: -2,
      width: '100%',
    },
  },
  selectedLens: {
    position: 'relative',
    borderTopLeftRadius: theme.borderRadius.small * 2,
    borderTopRightRadius: theme.borderRadius.small * 2,
    overflow: 'hidden',
    [theme.breakpoints.up('md')]: {
      // This entire block is to get us a rounded border with a gradient fade to the bottom, while keeping the lens the same height as the non-selected ones
      borderStyle: 'solid',
      borderColor: 'transparent',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        border: `1px solid ${theme.palette.grey[400]}`,
        borderTopLeftRadius: theme.borderRadius.small * 2,
        borderTopRightRadius: theme.borderRadius.small * 2,
        borderBottom: 'none',
        maskImage: `linear-gradient(to bottom,
          ${theme.palette.greyAlpha(1)} 0%,
          ${theme.palette.greyAlpha(0)} 100%
        )`,
        WebkitMaskImage: `linear-gradient(to bottom, 
          ${theme.palette.greyAlpha(1)} 0%,
          ${theme.palette.greyAlpha(0)} 100%
        )`,
      },
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
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      height: 'min-content',
    },
  },
  lensLabelWithoutSubtitle: {
    [theme.breakpoints.up('md')]: {
      paddingBottom: 3,
    },
  },
  lensTitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    textAlign: 'left',
    lineHeight: '1.2em',
    marginBottom: 0,
  },
  lensSubtitle: {
    ...theme.typography.subtitle,
    textTransform: 'none',
    textAlign: 'left',
    fontSize: '1em',
    fontWeight: 400,
    lineHeight: '1.2em',
    [theme.breakpoints.down('sm')]: {
      width: 'fit-content',
      display: 'block',
      textAlign: 'left',
      marginBottom: 1,
    },
  },
  likeButton: {
    marginTop: 4,
    marginLeft: 8,
  },
  deletedLens: {
    textDecoration: 'line-through',
  },
  newLensIcon: {
    alignSelf: 'center',
  },
}));

const LensTabBar = ({lenses, selectedLens, switchLens, getSelectedLensUrlPath}: {
  lenses: TagLens[],
  selectedLens: TagLens|undefined,
  switchLens: (lensId: string) => void,
  getSelectedLensUrlPath: (lensId: string) => string,
}) => {
  const classes = useStyles(styles);
  if (!(lenses.length > 1)) return null;

  // Sort lenses: main tab first, then by baseScore descending
  const sortedLenses = [...lenses].sort((a, b) => {
    if (a._id === MAIN_TAB_ID) return -1;
    if (b._id === MAIN_TAB_ID) return 1;
    return (b.baseScore ?? 0) - (a.baseScore ?? 0);
  });

  return <Tabs
    value={selectedLens?._id}
    onChange={(e, newLensId) => switchLens(newLensId)}
    classes={{
      flexContainer: classes.lensTabsContainer,
      indicator: classes.hideMuiTabIndicator
    }}
  >
    {sortedLenses.map(lens => <LensTab
      key={lens._id}
      value={lens._id}
      lens={lens}
      isSelected={selectedLens?._id === lens._id}
      getSelectedLensUrlPath={getSelectedLensUrlPath}
    />)}
  </Tabs>
}

// We need to pass through all of the props that Tab accepts in order to maintain the functionality of Tab switching/etc
const LensTab = ({ lens, value, isSelected, getSelectedLensUrlPath, onClick, onChange, ...tabProps }: {
  lens: TagLens,
  value: string
  isSelected: boolean,
  getSelectedLensUrlPath: (lensId: string) => string,
}
  & Omit<React.ComponentProps<typeof Tab>, 'key' | 'value' | 'label'>
) => {
  const classes = useStyles(styles);
  
  if (!lens) return null;

  const label = <div key={lens._id} className={classNames(classes.lensLabel, !lens.tabSubtitle && classes.lensLabelWithoutSubtitle)}>
    <div className={classes.lensTitleContainer}>
      <span className={classNames(classes.lensTitle, lens.deleted && classes.deletedLens)}>{lens.tabTitle}</span>
      {lens.tabSubtitle && <span className={classNames(classes.lensSubtitle, lens.deleted && classes.deletedLens)}>{lens.tabSubtitle}</span>}
    </div>
    <TagOrLensLikeButton lens={lens} isSelected={isSelected} className={classes.likeButton}/>
  </div>;
  
  // In the case where the user is cmd-clicking to open a link in a new tab (or doing something other than just clicking), we want to prevent the tab from being selected
  // The way we accomplish this is by wrapping the tab in an anchor tag, and then checking if the click was a special click (cmd-click, shift-click, etc.)
  // If it was, we let the click event propagate to the anchor tag as normal, while not passing the tab's onChange and onClick handlers to it, to avoid the tab being selected
  // Otherwise (if it was a regular click), we stop the click event from propagating to prevent it from reaching the anchor tag and manually call the tab's onChange and onClick handlers
  // This is pretty dumb and we should probably just rewrite lens tabs to not use MUI's Tab/Tabs.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const specialClick = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || e.button !== 0;
    if (specialClick) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    const fakeChangeEvent: React.ChangeEvent<{ checked: boolean }> = {
      ...e,
      target: { ...e.target, checked: false },
      currentTarget: { ...e.currentTarget, checked: false }
    };
    onChange?.(fakeChangeEvent, value);
    onClick?.(e);
  };

  return (
    <a href={getSelectedLensUrlPath(lens._id)}>
      <div className={classes.lensTabContainer}>
        <Tab
          className={classNames(classes.lensTab, isSelected && classes.selectedLens, !isSelected && classes.nonSelectedLens)}
          value={value}
          label={label}
          classes={{ root: classes.lensTabRootOverride, labelContainer: classes.tabLabelContainerOverride }}
          {...tabProps}
          onClick={handleClick}
        ></Tab>
      </div>
    </a>
  );
};

const TagOrLensLikeButton = ({lens, isSelected, stylingVariant, className}: {
  lens: TagLens,
  isSelected: boolean,
  stylingVariant?: "default" | "buttonRow",
  className?: string,
}) => {
  const lensVotingSystem = getVotingSystemByName("reactionsAndLikes");
  const isMainLens = (lens._id === MAIN_TAB_ID);

  return <Components.ReactionsAndLikesVote
    document={isMainLens ? {
      ...lens,
      //HACK: For the main lens we put a placeholder _id (see `getDefaultLens`). Put it back to make an object close-enough to a TagBasicInfo that it will work for voting.
      _id: lens.parentDocumentId,
    } : lens}
    collectionName={isMainLens ? "Tags" : "MultiDocuments"}
    votingSystem={lensVotingSystem}
    isSelected={isSelected}
    stylingVariant={stylingVariant}
    className={className}
  />
}


const LensTabBarComponent = registerComponent('LensTabBar', LensTabBar);
const LensTabComponent = registerComponent('LensTab', LensTab);
const TagOrLensLikeButtonComponent = registerComponent('TagOrLensLikeButton', TagOrLensLikeButton);

declare global {
  interface ComponentTypes {
    LensTabBar: typeof LensTabBarComponent
    LensTab: typeof LensTabComponent
    TagOrLensLikeButton: typeof TagOrLensLikeButtonComponent
  }
}

