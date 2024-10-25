import React, { useRef, useMemo } from 'react';
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
      "& $pinIcon": {
        display: 'block',
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
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  pinIcon: {
    width: 10,
    paddingBottom: 4,
    marginRight: 6,
    color: theme.palette.grey[600],
    // Hide the pin icon by default, show it when hovering over the glossary container
    display: 'none',
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
})

const getNormalizedPostContents = (post: PostsWithNavigationAndRevision | PostsWithNavigation): string => {
  return (post.contents?.html ?? "").toLowerCase();
};

const GlossarySidebar = ({post, postGlossariesPinned, togglePin, classes}: {
  post: PostsWithNavigationAndRevision | PostsWithNavigation,
  postGlossariesPinned: boolean,
  togglePin: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { SideItem, JargonTooltip, LWTooltip, ForumIcon } = Components;

  const currentUser = useCurrentUser();
  const glossaryContainerRef = useRef<HTMLDivElement>(null);

  useGlobalKeydown((e) => {
    const J_KeyCode = 74;
    if (e.altKey && e.shiftKey && e.keyCode === J_KeyCode) {
      togglePin();
    }
  });

  const { sortedTerms } = useJargonCounts(post, post.glossary);

  if (!post) {
    return null;
  }

  if (!userCanViewJargonTerms(currentUser)) {
    return null;
  }

  const tooltip = <div><p>Pin to highlight every term. (Opt/Alt + Shift + J)</p></div>;
  const titleRow = currentUser ? (
    <LWTooltip
      title={tooltip}
      inlineBlock={false}
      placement='top-end'
      popperClassName={classes.titleRowTooltipPopper}
    >
      <div className={classes.titleRow}>
        <h3 className={classes.title}><strong>Glossary</strong></h3>
        <ForumIcon icon='Pin' className={classes.pinIcon} />
      </div>
    </LWTooltip>
  ) : (
    <div className={classes.titleRow}>
      <h3 className={classes.title}><strong>Glossary</strong></h3>
    </div>
  );

  const glossaryItems = sortedTerms.map((jargonTerm) => {
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

  return <div className={classes.glossaryAnchor}><SideItem options={{ format: 'block', offsetTop: -10, measuredElement: glossaryContainerRef }}>
    <div className={classNames(postGlossariesPinned && classes.outerContainer)}>
      <div className={classNames(postGlossariesPinned && classes.innerContainer)}>
        <div className={classNames(classes.displayedHeightGlossaryContainer, postGlossariesPinned && classes.pinnedGlossaryContainer)} ref={glossaryContainerRef}>
          <div className={classNames(classes.glossaryContainer, currentUser && classes.glossaryContainerClickTarget)} onClick={currentUser ? togglePin : undefined}>
            {titleRow}
            {glossaryItems}
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
