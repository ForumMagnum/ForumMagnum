// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { useCurrentUser } from '../common/withUser';

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

export const JargonPromptTestingPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { results: posts = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "new",
      userId: currentUser?._id,
      limit: 5
    },
    itemsPerPage: 50,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  })
  if (!currentUser) {
    return <div>You must be logged in to view this page.</div>;
  }

  const { GlossaryEditForm, SingleColumnSection, PostsTitle, LoadMore } = Components


  return <div className={classes.root}>
    <SingleColumnSection>
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

const JargonPromptTestingPageComponent = registerComponent('JargonPromptTestingPage', JargonPromptTestingPage, {styles});

declare global {
  interface ComponentTypes {
    JargonPromptTestingPage: typeof JargonPromptTestingPageComponent
  }
}
