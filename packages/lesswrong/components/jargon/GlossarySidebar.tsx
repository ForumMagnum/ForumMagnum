import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';
import { useCurrentUser } from '../common/withUser';
import { userCanViewJargonTerms } from '@/lib/betas';

const styles = (theme: ThemeType) => ({
  title: {
    paddingTop: 198,
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
    paddingBottom: 20,
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

  return <SideItem>
    <div className={classes.glossaryContainer}>
      <h3 className={classes.title}>Glossary of Jargon</h3>
  
      {post.glossary.map((jargonTerm: GlossaryTerm) =>
        <div key={jargonTerm.term}>
          <JargonTooltip
            term={jargonTerm.term}
            definitionHTML={jargonTerm.html}
            altTerms={jargonTerm.altTerms}
            replacedSubstrings={jargonTermsToTextReplacements(post.glossary)}
            placement="left-start"
          >
            <div className={classes.jargonTerm}>{jargonTerm.term}</div>
          </JargonTooltip>
        </div>)
      }
    </div>
  </SideItem>
}

const GlossarySidebarComponent = registerComponent('GlossarySidebar', GlossarySidebar, {styles});

declare global {
  interface ComponentTypes {
    GlossarySidebar: typeof GlossarySidebarComponent
  }
}

