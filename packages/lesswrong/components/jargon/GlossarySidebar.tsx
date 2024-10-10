import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { jargonTermsToTextReplacements } from './JargonTooltip';

const styles = (theme: ThemeType) => ({
  glossary: {
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
  }
})

const GlossarySidebar = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType<typeof styles>,
}) => {
  const { JargonTooltip } = Components;
  if (!post.glossary.length) return null;

  return <div className={classes.glossaryContainer}>
    <h3 className={classes.glossary}>Glossary of Jargon</h3>

    {post?.glossary.map((jargonTerm: GlossaryTerm) =>
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
}

const GlossarySidebarComponent = registerComponent('GlossarySidebar', GlossarySidebar, {styles});

declare global {
  interface ComponentTypes {
    GlossarySidebar: typeof GlossarySidebarComponent
  }
}

