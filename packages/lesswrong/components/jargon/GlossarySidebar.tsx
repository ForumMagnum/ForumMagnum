import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import classNames from 'classnames';

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
    cursor: 'pointer'
  },
  glossaryContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
    padding: 12,
    borderRadius: 3,
    maxHeight: 170,
    overflow: 'hidden',

    "&:hover": {
      maxHeight: 'unset',
      // Show the pin icon when hovering over the glossary container
      "& $pinIcon": {
        display: 'block',
      },
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
    paddingTop: 30,
    paddingBottom: 20,
    // Hide other side items behind the glossary sidebar when it's pinned and we're scrolling down
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    zIndex: 1,

    "&:hover": {
      "& $overflowFade": {
        opacity: 0,
      },
    }
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
    color: theme.palette.grey[600],
  },
})

// TODO: maybe sort by first use instead of frequency?
function countInstancesOfJargon(item: JargonTermsPost, post: PostsWithNavigationAndRevision | PostsWithNavigation) {
  const jargonVariants = [item.term.toLowerCase(), ...(item.altTerms ?? []).map(altTerm => altTerm.toLowerCase())];
  return (post.contents?.html ?? "").toLowerCase().match(new RegExp(jargonVariants.join('|'), 'g'))?.length ?? 0;
};

const GlossarySidebar = ({post, postGlossariesPinned, togglePin, classes}: {
  post: PostsListWithVotes | PostsWithNavigationAndRevision | PostsWithNavigation,
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

  if (!post || !('glossary' in post) || !post.glossary?.length) {
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
  
  const sortedGlossary = [...post.glossary].sort((a, b) => {
    return countInstancesOfJargon(b, post) - countInstancesOfJargon(a, post);
  });

  const glossaryItems = sortedGlossary.map((jargonTerm) => {
    const replacedSubstrings = jargonTermsToTextReplacements(post.glossary);
    return (<div key={jargonTerm.term}>
      <JargonTooltip
        term={jargonTerm.term}
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
