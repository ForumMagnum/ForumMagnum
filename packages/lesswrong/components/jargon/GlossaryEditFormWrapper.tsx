// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMutation, gql } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {

  },
});

export const GlossaryEditFormWrapper = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage,
}) => {

  const { JargonEditorRow, LoadMore } = Components;

  const { results: glossary = [], loadMoreProps } = useMulti({
    terms: {
      view: "jargonTerms",
      postId: post._id,
      limit: 100
    },
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
    ssr: true,
  })

  // Define the mutation at the top level of your component
  const [getNewJargonTerms, { data, loading: mutationLoading, error }] = useMutation(gql`
    mutation getNewJargonTerms($postId: String!) {
      getNewJargonTerms(postId: $postId) {
        term
        contents {
          originalContents {
            data
            type
          }
        }
        altTerms
      }
    }
  `);

  // Event handler function
  const addNewJargonTerms = async () => { 
    try {
      const response = await getNewJargonTerms({
        variables: {
          postId: post._id,
        },
      });
      // Handle the response data as needed
    } catch (err) {
      // Handle the error as needed
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return <div className={classes.root}>
    {/* {!glossary && <GlossaryEditForm postId={post._id} />} */}
    {!!glossary && <>{glossary.map((item: any) => !item.isAltTerm && <JargonEditorRow key={item} jargonTerm={item}/>)}</>}
    <LoadMore {...loadMoreProps} />
    <div onClick={addNewJargonTerms}>Generate new terms</div>
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}
