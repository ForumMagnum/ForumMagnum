import React, { useRef, useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import classNames from 'classnames';
import { sidenotesHiddenBreakpoint } from '../posts/PostsPage/constants';
import { useJargonCounts } from '@/components/hooks/useJargonCounts';
import JargonTooltip, { jargonTermsToTextReplacements } from './JargonTooltip';
import { useTracking } from '@/lib/analyticsEvents';
import { useGlossaryPinnedState } from '../hooks/useUpdateGlossaryPinnedState';
import { useHover } from '../common/withHover';
import { SideItem } from "../contents/SideItems";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';

const lowOpacity = .4;
const highOpacity = .85;
const hoverOpacity = .7;
const pinnedOpacity = .5;

export const removeJargonDot = { 
  '& .JargonTooltip-jargonWord:after': {
    display: 'none'
  }
}

const styles = defineStyles("GlossarySidebar", (theme: ThemeType) => ({
  glossaryAnchor: {
    // HACK: If there is a footnote on the first line, because the footnote
    // anchor is in superscripted text, its position, for purposes of sidenote
    // ordering, will be above the top of the post body; but we want the
    // glossary side-item to be above the footnote side-item in this case.
    // So put the anchor for the glossary sidebar higher than the supercript
    // would be, and cancel it out with marginTop on glossaryContainer.
    position: "relative",
    top: -30,
  },
  jargonTerm: {
    paddingTop: 2,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontSize: "1.1rem",
    color: theme.palette.grey[800],
    cursor: 'pointer',
    textTransform: 'capitalize',
  },
  glossaryContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    padding: 12,
    borderRadius: 3,
    maxHeight: 170,
    width: 'fit-content',
    overflow: 'hidden',
    ...removeJargonDot,
    "&:hover": {
      maxHeight: 'unset',
      // Show the pin icon when hovering over the glossary container
      "& $pinIcon, & $pinnedPinIcon, & $unapprovedTermsCount, & $showAllTermsButton": {
        opacity: hoverOpacity
      },
      "& $pinIcon": {
        color: theme.palette.text.jargonTerm,
      },
      "& $pinnedPinIcon": {
        color: theme.palette.text.jargonTerm,
        filter: 'brightness(.93)',
        opacity: 1
      },
    },

    // Hide the overflow fade when hovering over the glossary container
    // This only works if the overflow fade is a sibling to the glossary container, and comes after it
    "&:hover + $overflowFade": {
      opacity: 0,
    },
  },
  glossaryContainerClickTarget: {
    cursor: 'pointer',
  },
  outerContainer: {
    height: 0,
  },
  innerContainer: {
    height: 'var(--sidebar-column-remaining-height)',
  },
  displayedHeightGlossaryContainer: {
    [sidenotesHiddenBreakpoint(theme)]: {
      display: "none",
    },
    paddingTop: 30,
    paddingBottom: 20,
    // Hide other side items behind the glossary sidebar when it's pinned and we're scrolling down
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1,
  },
  pinnedGlossaryContainer: {
    position: 'sticky',
    top: 100,
    '& $pinIcon': {
      opacity: pinnedOpacity
    },
    '& $pinnedPinIcon': {
      opacity: highOpacity, 
    },
    '& $unapprovedTermsCount': {
      opacity: highOpacity,
    },
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRowTooltipPopper: {
    marginBottom: 12,
  },
  title: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 0,
    marginTop: 0,
  },
  pinIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: -1,
    cursor: 'pointer',
    color: theme.palette.grey[600],
    // icon should be semi-transparent by default, escalatingly visible when hovering over the glossary container or over itself, directly
    opacity: 0,
    '&:hover': {
      opacity: hoverOpacity,
    }
  },
  unapprovedPinIcon: {
    opacity: lowOpacity,
  },
  pinnedPinIcon: {
    display: 'block',
    color: theme.palette.grey[900],
    opacity: pinnedOpacity,
    '&:hover': {
      opacity: hoverOpacity,
    }
  },
  termTooltip: {
    marginRight: 5,
  },
  overflowFade: {
    position: "absolute",
    top: 160,
    height: 40,
    width: "100%",
    background: `linear-gradient(0deg,${theme.palette.background.pageActiveAreaBackground},transparent)`,
    opacity: 1,
    pointerEvents: 'none',
  },
  unapproved: {
    color: theme.palette.grey[400],
  },
  showAllTermsButton: {
    cursor: 'pointer',
    fontSize: '1rem',
    ...theme.typography.commentStyle,
    paddingTop: 8,
    paddingBottom: 8,
    color: theme.palette.grey[400],
  },
  showAllTermsTooltipPopper: {
    maxWidth: 200,
  },
  unapprovedTermsCount: {
    margin: 0,
    marginTop: -3,
    ...theme.typography.body2,
    fontSize: '1rem',
    opacity: pinnedOpacity,
  }
}))

const GlossarySidebar = ({post, showAllTerms, setShowAllTerms, approvedTermsCount, unapprovedTermsCount}: {
  post: PostsWithNavigationAndRevision | PostsWithNavigation,
  showAllTerms: boolean,
  setShowAllTerms: (e: React.MouseEvent, showAllTerms: boolean, source: string) => void,
  approvedTermsCount: number,
  unapprovedTermsCount: number,
}) => {
  if (!post) {
    return null;
  }

  if (approvedTermsCount === 0) {
    return null;
  }
  
  return <GlossarySidebarInner
    post={post}
    showAllTerms={showAllTerms}
    setShowAllTerms={setShowAllTerms}
    approvedTermsCount={approvedTermsCount}
    unapprovedTermsCount={unapprovedTermsCount}
  />
}

const GlossarySidebarInner = ({post, showAllTerms, setShowAllTerms, approvedTermsCount, unapprovedTermsCount}: {
  post: PostsWithNavigationAndRevision | PostsWithNavigation,
  showAllTerms: boolean,
  setShowAllTerms: (e: React.MouseEvent, showAllTerms: boolean, source: string) => void,
  approvedTermsCount: number,
  unapprovedTermsCount: number,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const { postGlossariesPinned, togglePin } = useGlossaryPinnedState();

  const currentUser = useCurrentUser();
  const glossaryContainerRef = useRef<HTMLDivElement>(null);

  useGlobalKeydown((e) => {
    const J_KeyCode = 74;
    if (e.altKey && e.shiftKey && e.keyCode === J_KeyCode) {
      e.preventDefault();
      void togglePin('hotkey');
    }
  });

  const { sortedTerms } = useJargonCounts(post, post.glossary);
  const { hover: unapprovedTermsHover, eventHandlers: unapprovedHoverHandlers } = useHover();

  const approvedTerms = sortedTerms.filter(term => term.approved);
  const unapprovedTerms = sortedTerms.filter(term => !term.approved && !term.deleted);
  const deletedTerms = sortedTerms.filter(term => term.deleted);


  const tooltip = <div>{postGlossariesPinned ? 'Unpin to only highlight the first instance of each term.' : 'Pin to highlight every instance of a term.'}
    <div><em>(Opt/Alt + Shift + J)</em></div></div>;

  const onlyUnapprovedTerms = approvedTermsCount === 0 && unapprovedTermsCount > 0;

  const shouldShowAllTerms = showAllTerms || unapprovedTermsHover
  const displayAsPinned = onlyUnapprovedTerms ? showAllTerms : postGlossariesPinned;

  const replacedSubstrings = jargonTermsToTextReplacements(sortedTerms);

  const approvedGlossaryItems = approvedTerms.map((jargonTerm) => {
    return (<div key={jargonTerm._id + jargonTerm.term}>
      <JargonTooltip
        term={jargonTerm.term}
        definitionHTML={jargonTerm.contents?.html ?? ''}
        altTerms={jargonTerm.altTerms}
        humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
        approved={jargonTerm.approved}
        deleted={jargonTerm.deleted}
        placement="left-start"
        tooltipTitleClassName={classes.termTooltip}
        replacedSubstrings={replacedSubstrings}
        // The terms in the glossary should always have tooltips
        isFirstOccurrence
      >
        <div className={classNames(classes.jargonTerm, !jargonTerm.approved && classes.unapproved)}>{jargonTerm.term}</div>
      </JargonTooltip>
    </div>);
  });

  const otherGlossaryItems = shouldShowAllTerms ? [...unapprovedTerms, ...deletedTerms].map((jargonTerm) => {
    return (<div key={jargonTerm._id + jargonTerm.term}>
      <JargonTooltip
        term={jargonTerm.term}
        definitionHTML={jargonTerm.contents?.html ?? ''}
        altTerms={jargonTerm.altTerms}
        humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
        approved={jargonTerm.approved}
        deleted={jargonTerm.deleted}
        placement="left-start"
        tooltipTitleClassName={classes.termTooltip}
        // The terms in the glossary should always have tooltips
        isFirstOccurrence
        replacedSubstrings={replacedSubstrings}
      >
        <div className={classNames(classes.jargonTerm, !jargonTerm.approved && classes.unapproved)}>{jargonTerm.term}</div>
      </JargonTooltip>
    </div>);
  }) : null;
  
  const showAllTermsTooltip = <div>
    <div>{`Click to ${showAllTerms ? 'hide' : 'show'} hidden AI slop the author hasn't endorsed.`}</div>
    <div><em>(Opt/Alt + Shift + G)</em></div>
  </div>;
  const showAllTermsButton = <LWTooltip
    title={showAllTermsTooltip}
    inlineBlock={false}
    placement='right-end'
    popperClassName={classes.showAllTermsTooltipPopper}
  >
    <div className={classes.showAllTermsButton} onClick={(e) => setShowAllTerms(e, !showAllTerms, 'showAllTermsButton')}>
      {showAllTerms ? 'Hide Unapproved' : 'Show Unapproved'}
    </div>
  </LWTooltip>;

  const approvedTitleRow = (
    <LWTooltip
      title={tooltip}
      inlineBlock={false}
      placement='top-end'
      popperClassName={classes.titleRowTooltipPopper}
    >
      <div className={classes.titleRow} onClick={() => togglePin('clickGlossaryContainer')}>
        <h3 className={classes.title}>
          Glossary
        </h3> 
        <ForumIcon icon="Dictionary" className={classNames(classes.pinIcon, displayAsPinned && classes.pinnedPinIcon)} />
      </div>
    </LWTooltip>
  )

  const unapprovedTitleRow = (
    <LWTooltip title={<div>Pin to {displayAsPinned ? 'hide' : 'show'} a hacky AI generated glossary<br/> that the author doesn't endorse<div><em>(Opt/Alt + Shift + G)</em></div></div>} inlineBlock={false} placement='top-end' popperClassName={classes.titleRowTooltipPopper}>
      <div className={classes.titleRow} onClick={(e) => setShowAllTerms(e, !showAllTerms, 'unapprovedGlossaryClick')}  {...unapprovedHoverHandlers}>
        <ForumIcon icon="Dictionary" className={classNames(classes.pinIcon, classes.unapprovedPinIcon, displayAsPinned && classes.pinnedPinIcon)} /> 
        {displayAsPinned && <p className={classes.title}>Glossary (Auto)</p>}
      </div>
    </LWTooltip>
  )

  const titleRow = !onlyUnapprovedTerms ? approvedTitleRow : unapprovedTitleRow;

  return <div className={classes.glossaryAnchor}><SideItem options={{ format: 'block', offsetTop: -10, measuredElement: glossaryContainerRef }}>
    <div className={classNames(displayAsPinned && classes.outerContainer)}>
      <div className={classNames(displayAsPinned && classes.innerContainer)}>
        <div className={classNames(classes.displayedHeightGlossaryContainer, displayAsPinned && classes.pinnedGlossaryContainer)} ref={glossaryContainerRef}>
          <div className={classNames(classes.glossaryContainer, currentUser && classes.glossaryContainerClickTarget)}>
            {titleRow}  
            {approvedGlossaryItems}
            {!onlyUnapprovedTerms && showAllTermsButton}
            {otherGlossaryItems}
          </div>
          <div className={classes.overflowFade} />
        </div>
      </div>
    </div>
  </SideItem></div>
}

export default GlossarySidebar;


