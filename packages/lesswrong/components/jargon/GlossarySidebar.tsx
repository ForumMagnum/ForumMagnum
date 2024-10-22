import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';
import { ContentReplacementMode } from '../common/ContentItemBody';
import { useGlobalKeydown } from '../common/withGlobalKeydown';

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
    marginTop: 30,
    marginBottom: 20,
    cursor: 'pointer',
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
  pinToggle: {

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

  const tooltip = (<div>
    {/* <p>Click to toggle the glossary's pinned state.  When the glossary is pinned, every instance of each term in the post is highlighted and has a tooltip.  (By default, only the first instance of each term is highlighted and has a tooltip.)</p> */}
    <p>Toggle to pin or unpin the glossary.  (Option/Alt + Shift + J)</p>
  </div>);

  return <div className={classes.glossaryAnchor}><SideItem>
    <div className={classes.glossaryContainer} onClick={() => setReplaceAllJargon(!replaceAllJargon)}>
      <h3 className={classes.title}>Glossary of Jargon</h3>
  
      {post.glossary.map((jargonTerm: JargonTermsPost) => {
        const replacedSubstrings = jargonTermsToTextReplacements(post.glossary, jargonReplacementMode);
        return <div key={jargonTerm.term}>
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
        </div>;
      })}
      <LWTooltip title={tooltip} inlineBlock={false}>
        <div className={classes.pinControlRow}>
          <ForumIcon icon='Pin' className={classes.pinIcon} />
          <ToggleSwitch value={replaceAllJargon} />
        </div>
      </LWTooltip>
    </div>
  </SideItem></div>
}

const GlossarySidebarComponent = registerComponent('GlossarySidebar', GlossarySidebar, {styles});

declare global {
  interface ComponentTypes {
    GlossarySidebar: typeof GlossarySidebarComponent
  }
}

