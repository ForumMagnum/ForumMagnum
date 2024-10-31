import React, { useRef, useMemo, useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import classNames from 'classnames';
import { sidenotesHiddenBreakpoint } from '../posts/PostsPage/PostsPage';
import { useJargonCounts } from '@/components/hooks/useJargonCounts';

const styles = (theme: ThemeType) => ({
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

    "&:hover": {
      maxHeight: 'unset',
      // Show the pin icon when hovering over the glossary container
      "& $pinIcon, & $pinnedPinIcon": {
        opacity: 1,
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
      color: theme.palette.grey[800],
    },
  },
  titleRow: {
    display: 'flex',
  },
  titleRowTooltipPopper: {
    marginBottom: 12,
  },
  title: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  pinIcon: {
    width: 18,
    padding: 4,
    marginLeft: 6,
    color: theme.palette.grey[400],
    // Hide the pin icon by default, show it when hovering over the glossary container
    opacity: 0
  },
  pinnedPinIcon: {
    display: 'block',
    color: theme.palette.grey[800],
    opacity: .5
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
  deleted: {
    textDecoration: 'line-through',
  },
  showAllTermsButton: {
    marginTop: 10,
    cursor: 'pointer',
  },
  showAllTermsTooltipPopper: {
    maxWidth: 200,
  },
})

const GlossarySidebar = ({post, postGlossariesPinned, togglePin, showAllTerms, setShowAllTerms, classes}: {
  post: PostsWithNavigationAndRevision | PostsWithNavigation,
  postGlossariesPinned: boolean,
  togglePin: () => void,
  showAllTerms: boolean,
  setShowAllTerms: (e: React.MouseEvent, showAllTerms: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { SideItem, JargonTooltip, LWTooltip, ForumIcon } = Components;

  const currentUser = useCurrentUser();
  const glossaryContainerRef = useRef<HTMLDivElement>(null);

  useGlobalKeydown((e) => {
    const J_KeyCode = 74;
    if (e.altKey && e.shiftKey && e.keyCode === J_KeyCode) {
      e.preventDefault();
      togglePin();
    }
  });

  const { sortedTerms } = useJargonCounts(post, post.glossary);

  const approvedTerms = sortedTerms.filter(term => term.approved);
  const unapprovedTerms = sortedTerms.filter(term => !term.approved && !term.deleted);
  const deletedTerms = sortedTerms.filter(term => term.deleted);

  if (!post) {
    return null;
  }

  if (!userCanViewJargonTerms(currentUser)) {
    return null;
  }

  const tooltip = <div><p>Pin to highlight every instance of a term. (Opt/Alt + Shift + J)</p></div>;
  const titleRow = currentUser ? (
    <LWTooltip
      title={tooltip}
      inlineBlock={false}
      placement='top-end'
      popperClassName={classes.titleRowTooltipPopper}
    >
      <div className={classes.titleRow}>
        <h3 className={classes.title}>
          <strong>Glossary</strong>
          <ForumIcon icon="Pin" className={classNames(classes.pinIcon, postGlossariesPinned && classes.pinnedPinIcon)} />
        </h3>
      </div>
    </LWTooltip>
  ) : (
    <div className={classes.titleRow}>
      <h3 className={classes.title}><strong>Glossary</strong></h3>
    </div>
  );

  const approvedGlossaryItems = approvedTerms.map((jargonTerm) => {
    return (<div key={jargonTerm._id + jargonTerm.term}>
      <JargonTooltip
        definitionHTML={jargonTerm.contents?.html ?? ''}
        altTerms={jargonTerm.altTerms}
        humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
        approved={jargonTerm.approved}
        placement="left-start"
        tooltipTitleClassName={classes.termTooltip}
        // The terms in the glossary should always have tooltips
        isFirstOccurrence
      >
        <div className={classNames(classes.jargonTerm, !jargonTerm.approved && classes.unapproved)}>{jargonTerm.term}</div>
      </JargonTooltip>
    </div>);
  });

  const otherGlossaryItems = showAllTerms ? [...unapprovedTerms, ...deletedTerms].map((jargonTerm) => {
    return (<div key={jargonTerm._id + jargonTerm.term}>
      <JargonTooltip
        definitionHTML={jargonTerm.contents?.html ?? ''}
        altTerms={jargonTerm.altTerms}
        humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
        approved={jargonTerm.approved}
        placement="left-start"
        tooltipTitleClassName={classes.termTooltip}
        // The terms in the glossary should always have tooltips
        isFirstOccurrence
      >
        <div className={classNames(classes.jargonTerm, !jargonTerm.approved && classes.unapproved, jargonTerm.deleted && classes.deleted)}>{jargonTerm.term}</div>
      </JargonTooltip>
    </div>);
  }) : null;

  const showAllTermsTooltip = <div><p>{`Click to ${showAllTerms ? 'hide' : 'show'} terms the author hasn't approved.  These may be lower quality.  (Opt/Alt + Shift + G)`}</p></div>;
  const showAllTermsButton = <LWTooltip
    title={showAllTermsTooltip}
    inlineBlock={false}
    placement='right-end'
    popperClassName={classes.showAllTermsTooltipPopper}
  >
    <div className={classes.showAllTermsButton} onClick={(e) => setShowAllTerms(e, !showAllTerms)}>
      {showAllTerms ? 'Hide Unapproved Terms' : 'Show Unapproved Terms'}
    </div>
  </LWTooltip>;

  return <div className={classes.glossaryAnchor}><SideItem options={{ format: 'block', offsetTop: -10, measuredElement: glossaryContainerRef }}>
    <div className={classNames(postGlossariesPinned && classes.outerContainer)}>
      <div className={classNames(postGlossariesPinned && classes.innerContainer)}>
        <div className={classNames(classes.displayedHeightGlossaryContainer, postGlossariesPinned && classes.pinnedGlossaryContainer)} ref={glossaryContainerRef}>
          <div className={classNames(classes.glossaryContainer, currentUser && classes.glossaryContainerClickTarget)} onClick={currentUser ? togglePin : undefined}>
            {titleRow}
            {approvedGlossaryItems}
            {otherGlossaryItems}
            {showAllTermsButton}
          </div>
          <div className={classes.overflowFade} />
        </div>
      </div>
    </div>
  </SideItem></div>
}

const GlossarySidebarComponent = registerComponent('GlossarySidebar', GlossarySidebar, {styles});

declare global {
  interface ComponentTypes {
    GlossarySidebar: typeof GlossarySidebarComponent
  }
}
