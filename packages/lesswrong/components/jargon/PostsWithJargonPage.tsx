// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';

const styles = (theme: ThemeType) => ({
  post: {
    marginBottom: theme.spacing.unit * 2,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: theme.spacing.unit * 2,
  }
});

export const PostsWithJargonPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { results: posts = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "new",
      limit: 5
    },
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  })

  const { GlossaryEditForm, SingleColumnSection } = Components


  return <div className={classes.root}>
    <SingleColumnSection>
      {posts.map(post => <div key={post._id} className={classes.post}>
        <h2>{post.title}</h2>
        <GlossaryEditForm document={post} />
      </div>)}
    </SingleColumnSection>
  </div>;
}

const PostsWithJargonPageComponent = registerComponent('PostsWithJargonPage', PostsWithJargonPage, {styles});

declare global {
  interface ComponentTypes {
    PostsWithJargonPage: typeof PostsWithJargonPageComponent
  }
}
