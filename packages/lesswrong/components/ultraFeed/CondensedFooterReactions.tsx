import React, { useRef, useState } from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import { VotingProps } from "../votes/votingProps";
import { getNormalizedReactionsListFromVoteProps, reactionsListToDisplayedNumbers } from "@/lib/voting/reactionDisplayHelpers";
import { useCurrentUser } from "../common/withUser";
import ReactionIcon from "../votes/ReactionIcon";
import UltraFeedReactionsPalette from "../votes/UltraFeedReactionsPalette";
import ReactionsPalette from "../votes/ReactionsPalette";
import { useNamesAttachedReactionsVoting } from "../votes/lwReactions/NamesAttachedReactionsVoteOnComment";
import type { EmojiReactName } from "@/lib/voting/namesAttachedReactions";
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import DetailedReactionOverview from "../votes/lwReactions/DetailedReactionOverview";
import { Card } from "@/components/widgets/Paper";
import { AddReactionIcon } from '../icons/AddReactionIcon';
import HoverOver from "../common/HoverOver";

const ICON_BUTTON_SIZE = 24;
const ICON_BUTTON_SIZE_MOBILE = 26;

const styles = defineStyles("CondensedFooterReactions", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  reactionIconDisplay: {
    marginRight: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  reactionIconContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  reactionIconWrapper: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[200],
    border: `2px solid ${theme.palette.background.paper}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    '& > *': {
      transform: 'scale(0.9)',
      [theme.breakpoints.down('sm')]: {
        transform: 'scale(0.9)',
      },
    },
    [theme.breakpoints.down('sm')]: {
      width: ICON_BUTTON_SIZE_MOBILE,
      height: ICON_BUTTON_SIZE_MOBILE,
    },
  },
  ellipsisIconWrapper: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[200],
    border: `2px solid ${theme.palette.background.paper}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: -8, // Overlap with the previous icon
    zIndex: 1,
    fontSize: 8,
    color: theme.palette.ultraFeed.dim,
    fontWeight: 600,
    [theme.breakpoints.down('sm')]: {
      width: ICON_BUTTON_SIZE_MOBILE,
      height: ICON_BUTTON_SIZE_MOBILE,
    },
  },
  reactsAndCount: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '8px',
    cursor: 'pointer',
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.ultraFeed.dim,
    lineHeight: '1',
    padding: '2px 6px',
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      opacity: 1
    }
  },
  reactsAndCountActive: {
    backgroundColor: theme.palette.grey[200],
  },
  overviewPopperCard: {
    padding: 0,
    fontFamily: theme.typography.commentStyle.fontFamily,
    borderRadius: 2,
    width: 374,
    [theme.breakpoints.down('sm')]: {
      width: 304,
    },
  },
  desktopPopupContentWrapper: {
    padding: 12,
  },
  overviewButton: {
    opacity: .35,
    cursor: "pointer",
    height: 18,
    width: 18,
  },
  addReactionButton: {
    opacity: 0.4,
    position: "relative",
    top: 2,
    color: theme.palette.ultraFeed.dim,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      opacity: 1,
    },
    '& svg': {
      height: 20,
      width: 20,
    },
    [theme.breakpoints.down('sm')]: {
      top: 1,
      opacity: 1,
    },
  },
  addReactionButtonActive: {
    backgroundColor: theme.palette.grey[200],
    opacity: 1,
  },
  hiddenOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  hiddenOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  addReactionDesktopExtra: {
    marginLeft: 16,
  },
  mobileTabContent: {
    padding: 12,
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.border.faint}`,
    marginBottom: 0,
  },
  tabButton: {
    flexGrow: 1,
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.secondary,
    borderBottom: '2px solid transparent',
    transition: 'color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    '&:hover': {
      color: theme.palette.text.primary,
    },
    '& svg': {
      height: 20,
      width: 20,
    }
  },
  tabButtonActive: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    borderBottomColor: theme.palette.primary.main,
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paletteDisabledText: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
}));

interface CondensedFooterReactionsSharedProps {
  allowReactions: boolean;
  voteProps: VotingProps<VoteableTypeClient>;
  classes: Record<string, string>;
  topIcon: React.ReactNode | null;
  totalReactionCount: number;
  currentUser: UsersCurrent | null;
  toggleReactionMain: (name: string, quote: string | null) => void;
  getCurrentUserReactionVoteMain: ReturnType<typeof useNamesAttachedReactionsVoting>['getCurrentUserReactionVote'];
}

const CondensedFooterReactionsDesktop = ({
  classes,
  voteProps,
  topIcon,
  totalReactionCount,
  toggleReactionMain,
  getCurrentUserReactionVoteMain,
  allowReactions,
}: CondensedFooterReactionsSharedProps) => {
  const paletteAnchorEl = useRef<HTMLDivElement>(null);
  
  const [showPalettePopup, setShowPalettePopup] = useState(false);

  const handleToggleReactionWithClosePalette = (name: string, quote: string | null) => {
    toggleReactionMain(name, quote);
    setShowPalettePopup(false);
  };

  const overviewContent = (
    <Card className={classes.overviewPopperCard}>
      <div className={classes.desktopPopupContentWrapper}>
        <DetailedReactionOverview voteProps={voteProps} />
      </div>
    </Card>
  );

  return (
    <div className={classes.root}>
      {totalReactionCount > 0 && (
        <HoverOver
          title={overviewContent}
          clickable
          placement="top-end" 
          tooltip={false}
          hideOnTouchScreens={true}
        >
          <span 
            className={classNames(classes.reactsAndCount)}
          >
            {topIcon}
            {totalReactionCount}
          </span>
        </HoverOver>
      )}
      
      {allowReactions && (
        <>
          <span ref={paletteAnchorEl} >
            <span
              className={classNames(classes.addReactionButton, classes.addReactionDesktopExtra, { [classes.addReactionButtonActive]: showPalettePopup })}
              onClick={() => setShowPalettePopup(prev => !prev)}
            >
              <AddReactionIcon />
            </span>
          </span>

          {paletteAnchorEl.current && showPalettePopup && (
            <LWPopper open={showPalettePopup} anchorEl={paletteAnchorEl.current} placement="bottom-end" allowOverflow={true} distance={4}>
              <LWClickAwayListener onClickAway={() => setShowPalettePopup(false)}>
                <Card className={classes.overviewPopperCard}>
                  <div className={classes.desktopPopupContentWrapper}>
                    <ReactionsPalette quote={null} getCurrentUserReactionVote={getCurrentUserReactionVoteMain} toggleReaction={handleToggleReactionWithClosePalette} />
                  </div>
                </Card>
              </LWClickAwayListener>
            </LWPopper>
          )}
        </>
      )}
    </div>
  );
};

const CondensedFooterReactionsMobile = ({
  classes,
  voteProps,
  topIcon,
  totalReactionCount,
  toggleReactionMain,
  getCurrentUserReactionVoteMain,
  allowReactions,
}: CondensedFooterReactionsSharedProps) => {
  const anchorEl = useRef<HTMLDivElement>(null);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'palette'>('overview');
  const [justClosedByClickAway, setJustClosedByClickAway] = useState(false);

  if (!allowReactions && totalReactionCount === 0) {
    return (
      <div className={classes.root} ref={anchorEl}>
        <HoverOver
          title="Reacting not enabled on this document, e.g. posts"
          placement="top"
          tooltip={true}
        >
          <span
            className={classNames(classes.addReactionButton, classes.disabledButton)}
          >
            <AddReactionIcon />
          </span>
        </HoverOver>
      </div>
    );
  }

  // justClosedByClickAway is used to prevent the popup reopening when you close it on mobile
  const handleClickAway = () => {
    setShowMobilePopup(false);
    setJustClosedByClickAway(true);
    setTimeout(() => setJustClosedByClickAway(false), 50);
  };

  const handleMobilePopupToggle = (targetTab: 'overview' | 'palette') => {
    if (justClosedByClickAway) return;

    if (showMobilePopup) {
      if (activeMobileTab === targetTab) {
        setShowMobilePopup(false);
      } else {
        setActiveMobileTab(targetTab);
      }
    } else {
      setActiveMobileTab(targetTab);
      setShowMobilePopup(true);
    }
  };
  
  const handleToggleReactionWithClose = (name: string, quote: string | null) => {
    toggleReactionMain(name, quote);
    setShowMobilePopup(false);
  };
  
  const mobileTabs: Array<{value: 'overview' | 'palette', label: React.ReactNode}> = [
    { value: 'overview', label: `${totalReactionCount > 0 ? totalReactionCount : ''} Reacts` },
    { value: 'palette', label: <AddReactionIcon /> },
  ];

  return (
    <div ref={anchorEl} className={classes.root}>
      {totalReactionCount > 0 && (
        <span
          className={classNames(classes.reactsAndCount, { [classes.reactsAndCountActive]: showMobilePopup && activeMobileTab === 'overview' })}
          onClick={() => handleMobilePopupToggle('overview')}
        >
          {topIcon}
          {totalReactionCount}
        </span>
      )}
      {totalReactionCount === 0 && allowReactions && (
        <span
          className={classNames(classes.addReactionButton, { [classes.addReactionButtonActive]: showMobilePopup && activeMobileTab === 'palette' })}
          onClick={() => handleMobilePopupToggle('palette')}
        >
          <AddReactionIcon />
        </span>
      )}
      
      {anchorEl.current && showMobilePopup && (
         <LWPopper open={showMobilePopup} anchorEl={anchorEl.current} placement="bottom-end" allowOverflow={true} distance={4}>
           <LWClickAwayListener onClickAway={handleClickAway}>
             <Card className={classes.overviewPopperCard}>
                <div className={classes.tabsContainer}>
                  {mobileTabs.map(tab => (
                    <div 
                      key={tab.value}
                      className={classNames(classes.tabButton, { [classes.tabButtonActive]: activeMobileTab === tab.value })}
                      onClick={() => handleMobilePopupToggle(tab.value)}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
                <div className={classes.mobileTabContent}>
                  {activeMobileTab === 'overview' && totalReactionCount > 0 && (
                    <DetailedReactionOverview voteProps={voteProps} />
                  )}
                  {activeMobileTab === 'palette' && !allowReactions && (
                    <div className={classes.paletteDisabledText}>
                      To leave inline reacts, open the full post
                    </div>
                  )}
                  {activeMobileTab === 'palette' && allowReactions && (
                    <UltraFeedReactionsPalette getCurrentUserReactionVote={getCurrentUserReactionVoteMain} toggleReaction={handleToggleReactionWithClose} />
                  )}
                </div>
             </Card>
           </LWClickAwayListener>
         </LWPopper>
      )}
    </div>
  );
};

interface CondensedFooterReactionsProps {
  voteProps: VotingProps<VoteableTypeClient>;
  allowReactions: boolean;
  className?: string;
}

const CondensedFooterReactions = ({
  voteProps,
  allowReactions,
  className,
}: CondensedFooterReactionsProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  const reactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const visibleReactionsDisplay = reactionsList?.reacts 
    ? reactionsListToDisplayedNumbers(reactionsList.reacts, currentUser?._id)
    : [];

  const sortedReactions = visibleReactionsDisplay.sort((a, b) => b.numberShown - a.numberShown);
  const totalReactionCount = sortedReactions.reduce((sum, reaction) => sum + reaction.numberShown, 0);

  const topIconElement: React.ReactNode | null = sortedReactions.length > 0 && totalReactionCount > 0 ? (
    <div className={classes.reactionIconContainer}>
      <div className={classes.reactionIconWrapper}>
        <ReactionIcon react={sortedReactions[0]?.react as EmojiReactName} />
      </div>
      {sortedReactions.length > 1 && (
        <div className={classes.ellipsisIconWrapper}>
          •••
        </div>
      )}
    </div>
  ) : null;
  
  const sharedProps: CondensedFooterReactionsSharedProps = {
    allowReactions,
    voteProps,
    classes,
    topIcon: topIconElement,
    totalReactionCount,
    currentUser,
    toggleReactionMain: toggleReaction, 
    getCurrentUserReactionVoteMain: getCurrentUserReactionVote,
  };

  return (
    <>
      <div className={classNames(className, classes.hiddenOnMobile)}>
        <CondensedFooterReactionsDesktop {...sharedProps} />
      </div>
      <div className={classNames(className, classes.hiddenOnDesktop)}>
        <CondensedFooterReactionsMobile {...sharedProps} />
      </div>
    </>
  );
};

export default CondensedFooterReactions;
