// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useSingle } from '@/lib/crud/withSingle';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const GlossaryEditForm = ({classes, postId}: {
  classes: ClassesType<typeof styles>,
  postId: string,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  // console.log("I'm about to do a useSingle");

  // const {document: post, error} = useSingle({
  //   documentId: postId,
  //   collectionName: "Posts",
  //   fragmentName: "PostsJargonTerms",
  // });

  // console.log(post);

  // React.useEffect(() => {
  //   if (post?.jargonTerms) {
  //     localStorage.setItem(`glossary-${postId}`, JSON.stringify(post.jargonTerms));
  //   }
  // }, [post, postId]);

  // if (error) {
  //   return <div>Error loading post: {error.message}</div>;
  // }

  return null;
}

const GlossaryEditFormComponent = registerComponent('GlossaryEditForm', GlossaryEditForm, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditForm: typeof GlossaryEditFormComponent
  }
}
