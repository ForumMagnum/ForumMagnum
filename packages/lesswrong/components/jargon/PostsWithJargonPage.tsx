// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PostsWithJargonPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { results: jargonTerms = [], loadMoreProps, refetch } = useMulti({
    terms: {
      view: "postEditorJargonTerms",
      limit: 1000
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsWithPostInfo',
  })

  const posts = jargonTerms.map(term => ({
    ...term.post,
    jargon: jargonTerms.filter(t => t.postId === term.postId)
  }))


  return <div className={classes.root}>
  </div>;
}

const PostsWithJargonPageComponent = registerComponent('PostsWithJargonPage', PostsWithJargonPage, {styles});

declare global {
  interface ComponentTypes {
    PostsWithJargonPage: typeof PostsWithJargonPageComponent
  }
}
