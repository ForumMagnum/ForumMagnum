import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';

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
  }
})

const GlossarySidebar = ({post, classes}: {
  post: PostsDetails|PostsListWithVotes,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { SideItem, JargonTooltip } = Components;

  if (!post || !('glossary' in post) || !post.glossary?.length) {
    return null;
  }
  if (!userCanViewJargonTerms(currentUser)) {
    return null;
  }

  return <div className={classes.glossaryAnchor}><SideItem>
    <div className={classes.glossaryContainer}>
      <h3 className={classes.title}>Glossary of Jargon</h3>
  
      {post.glossary.map((jargonTerm: JargonTermsPost) =>
        <div key={jargonTerm.term}>
          <JargonTooltip
            term={jargonTerm.term}
            definitionHTML={jargonTerm.contents?.html ?? ''}
            altTerms={jargonTerm.altTerms}
            humansAndOrAIEdited={jargonTerm.humansAndOrAIEdited}
            replacedSubstrings={jargonTermsToTextReplacements(post.glossary)}
            placement="left-start"
          >
            <div className={classes.jargonTerm}>{jargonTerm.term}</div>
          </JargonTooltip>
        </div>)
      }
    </div>
  </SideItem></div>
}

const GlossarySidebarComponent = registerComponent('GlossarySidebar', GlossarySidebar, {styles});

declare global {
  interface ComponentTypes {
    GlossarySidebar: typeof GlossarySidebarComponent
  }
}

