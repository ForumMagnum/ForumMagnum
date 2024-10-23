import React, { useRef } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';
import { ContentReplacementMode } from '../common/ContentItemBody';
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
  title: {
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
    "&:hover": {
      background: theme.palette.background.glossaryBackground,
    },
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
  },
  pinnedGlossaryContainer: {
    position: 'sticky',
    top: 100,
  },
  pinControlRow: {
    display: 'flex',
    justifyContent: 'end',
  },
  pinIcon: {
    width: 14,
    marginRight: 6,
    color: theme.palette.grey[600],
  },
})

const GlossarySidebar = ({post, replaceAllJargon, setReplaceAllJargon, classes}: {
  post: PostsDetails|PostsListWithVotes,
  replaceAllJargon: boolean,
  setReplaceAllJargon: (replaceAll: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { SideItem, JargonTooltip, LWTooltip, ForumIcon, ToggleSwitch } = Components;

  const currentUser = useCurrentUser();
  const glossaryContainerRef = useRef<HTMLDivElement>(null);

  const jargonReplacementMode: ContentReplacementMode = replaceAllJargon ? 'all' : 'first';

  useGlobalKeydown((e) => {
    const J_KeyCode = 74;
    if (e.altKey && e.shiftKey && e.keyCode === J_KeyCode) {
      setReplaceAllJargon(!replaceAllJargon);
    }
  });

  if (!post || !('glossary' in post) || !post.glossary?.length) {
    return null;
  }
  if (!userCanViewJargonTerms(currentUser)) {
    return null;
  }

  const glossaryItems = post.glossary.map((jargonTerm: JargonTermsPost) => {
    const replacedSubstrings = jargonTermsToTextReplacements(post.glossary, jargonReplacementMode);
    return (<div key={jargonTerm.term}>
      <JargonTooltip
        term={jargonTerm.term}
        definitionHTML={jargonTerm.contents?.html ?? ''}
        altTerms={jargonTerm.altTerms}
        humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
        replacedSubstrings={replacedSubstrings}
        placement="left-start"
      >
        <div className={classes.jargonTerm}>{jargonTerm.term}</div>
      </JargonTooltip>
    </div>);
  });

  const tooltip = <div><p>Toggle to pin or unpin the glossary.  (Opt/Alt + Shift + J)</p></div>;
  const pinControl = (<LWTooltip title={tooltip} inlineBlock={false}>
    <div className={classes.pinControlRow}>
      <ForumIcon icon='Pin' className={classes.pinIcon} />
      <ToggleSwitch value={replaceAllJargon} />
    </div>
  </LWTooltip>);

  return <div className={classes.glossaryAnchor}><SideItem options={{ format: 'block', offsetTop: 0, measuredElement: glossaryContainerRef }}>
    <div className={classNames(replaceAllJargon && classes.outerContainer)}>
      <div className={classNames(replaceAllJargon && classes.innerContainer)}>
        <div className={classNames(classes.displayedHeightGlossaryContainer, replaceAllJargon && classes.pinnedGlossaryContainer)} ref={glossaryContainerRef}>
          <div className={classes.glossaryContainer} onClick={() => setReplaceAllJargon(!replaceAllJargon)}>
            <h3 className={classes.title}>Glossary of Jargon</h3>
            {glossaryItems}
            {pinControl}
          </div>
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

