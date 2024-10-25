// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userWillPassivelyGenerateJargonTerms } from '@/lib/betas';

const styles = (theme: ThemeType) => ({
  root: {
  },
  glossary: {
    marginTop: 4,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 4,
  },
  post: {
    marginBottom: theme.spacing.unit * 4,
  }
});

export const GlossaryEditorPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { results: posts = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "glossaryEditorPosts",
      limit: 5
    },
    itemsPerPage: 50,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  })

  const { GlossaryEditForm, SingleColumnSection, PostsTitle, LoadMore, SectionTitle, ContentStyles, ErrorAccessDenied } = Components

  if (!currentUser) {
    return <SingleColumnSection><ErrorAccessDenied/></SingleColumnSection>;
  }
  if (!userWillPassivelyGenerateJargonTerms(currentUser)) {
    return <SingleColumnSection>
      Currently, the Glossary Editor is only available to users with over 100 karma.
    </SingleColumnSection>;
  }

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Glossary Editor" />
      <ContentStyles contentType="post">
        <><p>Edit the glossary for your posts.</p><br/><br/></>
      </ContentStyles>
      {posts.map(post => <div key={post._id} className={classes.post}>
        <PostsTitle post={post} showIcons={false}/>
        <div className={classes.glossary}>
          <GlossaryEditForm document={post} showTitle={false}/>
        </div>
      </div>)}
      <LoadMore {...loadMoreProps} />
    </SingleColumnSection>
  </div>;
}

const GlossaryEditorPageComponent = registerComponent('GlossaryEditorPage', GlossaryEditorPage, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditorPage: typeof GlossaryEditorPageComponent
  }
}
